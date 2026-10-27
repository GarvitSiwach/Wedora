-- ============================================================================
-- WEDORA PHASE 7: RSVP & GUEST RESPONSE SYSTEM
-- Migration: 20261030000000_wedora_phase7_rsvp.sql
-- Description: Adds RSVP settings to wedding_websites, secure invitation tokens
--              and response fields to wedding_guests, automated token triggers,
--              and secure public/private RSVP RPC functions.
-- ============================================================================

-- Ensure pgcrypto extension is available for secure hashing/random generation
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================================
-- 1. EXTEND WEDDING_WEBSITES WITH RSVP SETTINGS
-- ============================================================================

ALTER TABLE public.wedding_websites
  ADD COLUMN IF NOT EXISTS rsvp_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rsvp_deadline DATE,
  ADD COLUMN IF NOT EXISTS ask_meal_preference BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS meal_options TEXT[] NOT NULL DEFAULT ARRAY['Standard', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Child']::TEXT[],
  ADD COLUMN IF NOT EXISTS allow_guest_message BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- 2. EXTEND WEDDING_GUESTS WITH INVITATION TOKENS & RSVP FIELDS
-- ============================================================================

ALTER TABLE public.wedding_guests
  ADD COLUMN IF NOT EXISTS invitation_token TEXT,
  ADD COLUMN IF NOT EXISTS invitation_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS max_attendees INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS attendee_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meal_preference TEXT,
  ADD COLUMN IF NOT EXISTS guest_message TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Constraints on attendee limits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_wedding_guests_max_attendees'
  ) THEN
    ALTER TABLE public.wedding_guests
      ADD CONSTRAINT chk_wedding_guests_max_attendees CHECK (max_attendees >= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_wedding_guests_attendee_count'
  ) THEN
    ALTER TABLE public.wedding_guests
      ADD CONSTRAINT chk_wedding_guests_attendee_count CHECK (attendee_count >= 0 AND attendee_count <= max_attendees);
  END IF;
END $$;

-- Populate tokens for any existing guests lacking one
UPDATE public.wedding_guests
SET
  invitation_token = COALESCE(invitation_token, encode(extensions.gen_random_bytes(16), 'hex')),
  invitation_token_hash = COALESCE(invitation_token_hash, encode(extensions.digest(COALESCE(invitation_token, encode(extensions.gen_random_bytes(16), 'hex')), 'sha256'), 'hex'))
WHERE invitation_token IS NULL OR invitation_token_hash IS NULL;

-- Unique constraint & indexes for invitation tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_wedding_guests_invitation_token'
  ) THEN
    ALTER TABLE public.wedding_guests
      ADD CONSTRAINT uq_wedding_guests_invitation_token UNIQUE (invitation_token);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_wedding_guests_invitation_token_hash'
  ) THEN
    ALTER TABLE public.wedding_guests
      ADD CONSTRAINT uq_wedding_guests_invitation_token_hash UNIQUE (invitation_token_hash);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wedding_guests_invitation_token_hash ON public.wedding_guests(invitation_token_hash);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_invitation_token ON public.wedding_guests(invitation_token);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_responded ON public.wedding_guests(wedding_id, invitation_status, responded_at);

-- Trigger to automatically generate tokens for new guest records
CREATE OR REPLACE FUNCTION public.set_guest_invitation_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.invitation_token IS NULL OR trim(NEW.invitation_token) = '' THEN
    NEW.invitation_token := encode(extensions.gen_random_bytes(16), 'hex');
  END IF;
  NEW.invitation_token_hash := encode(extensions.digest(NEW.invitation_token, 'sha256'), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wedding_guests_token ON public.wedding_guests;
CREATE TRIGGER trg_wedding_guests_token
  BEFORE INSERT ON public.wedding_guests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_guest_invitation_token();

-- ============================================================================
-- 3. SECURE PUBLIC RSVP RESOLUTION FUNCTION
-- ============================================================================

-- Safely resolves a guest invitation by token for a published wedding.
-- Returns strictly sanitized public RSVP information; NEVER returns private notes,
-- guest phone numbers, email addresses, or workspace data.
CREATE OR REPLACE FUNCTION public.get_public_rsvp_by_token(
  p_slug TEXT,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_website RECORD;
  v_guest RECORD;
  v_token_clean TEXT;
  v_token_hash TEXT;
  v_is_closed BOOLEAN;
BEGIN
  IF p_slug IS NULL OR p_token IS NULL THEN
    RETURN NULL;
  END IF;

  v_token_clean := lower(trim(p_token));
  IF length(v_token_clean) < 8 THEN
    RETURN NULL;
  END IF;

  v_token_hash := encode(extensions.digest(v_token_clean, 'sha256'), 'hex');

  -- Verify wedding website is published
  SELECT w.wedding_id, w.slug, w.is_published, w.rsvp_enabled, w.rsvp_deadline,
         w.ask_meal_preference, w.meal_options, w.allow_guest_message
  INTO v_website
  FROM public.wedding_websites w
  WHERE w.slug = lower(trim(p_slug))
    AND w.is_published = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Determine if RSVP is closed
  v_is_closed := (NOT v_website.rsvp_enabled) OR (v_website.rsvp_deadline IS NOT NULL AND v_website.rsvp_deadline < CURRENT_DATE);

  -- Locate guest by token hash or token string
  SELECT g.id, g.full_name, g.invitation_status, g.max_attendees,
         g.attendee_count, g.meal_preference, g.guest_message, g.responded_at
  INTO v_guest
  FROM public.wedding_guests g
  WHERE g.wedding_id = v_website.wedding_id
    AND (g.invitation_token_hash = v_token_hash OR g.invitation_token = v_token_clean);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'guest', jsonb_build_object(
      'id', v_guest.id,
      'full_name', v_guest.full_name,
      'invitation_status', v_guest.invitation_status,
      'max_attendees', v_guest.max_attendees,
      'attendee_count', v_guest.attendee_count,
      'meal_preference', v_guest.meal_preference,
      'guest_message', v_guest.guest_message,
      'responded_at', v_guest.responded_at
    ),
    'settings', jsonb_build_object(
      'rsvp_enabled', v_website.rsvp_enabled,
      'rsvp_deadline', v_website.rsvp_deadline,
      'ask_meal_preference', v_website.ask_meal_preference,
      'meal_options', v_website.meal_options,
      'allow_guest_message', v_website.allow_guest_message,
      'is_closed', v_is_closed
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_rsvp_by_token(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_rsvp_by_token(TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- 4. SECURE PUBLIC RSVP SUBMISSION FUNCTION
-- ============================================================================

-- Processes an RSVP submission/update from an anonymous guest holding a valid token.
-- Validates deadline, attendee count limits, and permitted statuses.
CREATE OR REPLACE FUNCTION public.submit_public_rsvp(
  p_slug TEXT,
  p_token TEXT,
  p_status TEXT,
  p_attendee_count INTEGER,
  p_meal_preference TEXT,
  p_guest_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_website RECORD;
  v_guest RECORD;
  v_token_clean TEXT;
  v_token_hash TEXT;
  v_clean_status TEXT;
  v_final_count INTEGER;
  v_clean_meal TEXT;
  v_clean_message TEXT;
BEGIN
  IF p_slug IS NULL OR p_token IS NULL OR p_status IS NULL THEN
    RAISE EXCEPTION 'Missing required RSVP parameters.';
  END IF;

  v_token_clean := lower(trim(p_token));
  v_token_hash := encode(extensions.digest(v_token_clean, 'sha256'), 'hex');
  v_clean_status := lower(trim(p_status));

  IF v_clean_status NOT IN ('confirmed', 'declined') THEN
    RAISE EXCEPTION 'Invalid response status. Must be confirmed or declined.';
  END IF;

  -- Verify published website and RSVP open status
  SELECT w.wedding_id, w.is_published, w.rsvp_enabled, w.rsvp_deadline,
         w.ask_meal_preference, w.meal_options, w.allow_guest_message
  INTO v_website
  FROM public.wedding_websites w
  WHERE w.slug = lower(trim(p_slug))
    AND w.is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wedding website not found or unpublished.';
  END IF;

  IF NOT v_website.rsvp_enabled THEN
    RAISE EXCEPTION 'RSVP responses are currently closed for this celebration.';
  END IF;

  IF v_website.rsvp_deadline IS NOT NULL AND v_website.rsvp_deadline < CURRENT_DATE THEN
    RAISE EXCEPTION 'The RSVP deadline for this celebration has passed.';
  END IF;

  -- Locate guest
  SELECT g.id, g.wedding_id, g.full_name, g.max_attendees
  INTO v_guest
  FROM public.wedding_guests g
  WHERE g.wedding_id = v_website.wedding_id
    AND (g.invitation_token_hash = v_token_hash OR g.invitation_token = v_token_clean);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or unrecognized invitation token.';
  END IF;

  -- Calculate and validate attendee count
  IF v_clean_status = 'declined' THEN
    v_final_count := 0;
    v_clean_meal := NULL;
  ELSE
    v_final_count := COALESCE(p_attendee_count, 1);
    IF v_final_count < 1 OR v_final_count > v_guest.max_attendees THEN
      RAISE EXCEPTION 'Attendee count must be between 1 and % for this invitation.', v_guest.max_attendees;
    END IF;

    IF v_website.ask_meal_preference THEN
      v_clean_meal := nullif(trim(p_meal_preference), '');
    ELSE
      v_clean_meal := NULL;
    END IF;
  END IF;

  IF v_website.allow_guest_message THEN
    v_clean_message := nullif(trim(p_guest_message), '');
  ELSE
    v_clean_message := NULL;
  END IF;

  -- Update guest response atomically
  UPDATE public.wedding_guests
  SET
    invitation_status = v_clean_status,
    attendee_count = v_final_count,
    meal_preference = v_clean_meal,
    guest_message = v_clean_message,
    responded_at = pg_catalog.now(),
    updated_at = pg_catalog.now()
  WHERE id = v_guest.id;

  RETURN jsonb_build_object(
    'success', true,
    'full_name', v_guest.full_name,
    'invitation_status', v_clean_status,
    'attendee_count', v_final_count,
    'meal_preference', v_clean_meal,
    'guest_message', v_clean_message,
    'responded_at', pg_catalog.now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_rsvp(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_public_rsvp(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- 5. SECURE MEMBER RPC: REGENERATE INVITATION TOKEN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.regenerate_guest_invitation_token(p_guest_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_guest RECORD;
  v_new_token TEXT;
  v_new_hash TEXT;
BEGIN
  -- Verify guest existence and member editing authorization
  SELECT g.id, g.wedding_id
  INTO v_guest
  FROM public.wedding_guests g
  WHERE g.id = p_guest_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Guest not found.';
  END IF;

  IF NOT public.can_manage_wedding_content(v_guest.wedding_id) THEN
    RAISE EXCEPTION 'Not authorized to manage guests for this celebration.';
  END IF;

  v_new_token := encode(extensions.gen_random_bytes(16), 'hex');
  v_new_hash := encode(extensions.digest(v_new_token, 'sha256'), 'hex');

  UPDATE public.wedding_guests
  SET
    invitation_token = v_new_token,
    invitation_token_hash = v_new_hash,
    updated_at = pg_catalog.now()
  WHERE id = p_guest_id;

  RETURN v_new_token;
END;
$$;

REVOKE ALL ON FUNCTION public.regenerate_guest_invitation_token(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.regenerate_guest_invitation_token(UUID) TO authenticated;
