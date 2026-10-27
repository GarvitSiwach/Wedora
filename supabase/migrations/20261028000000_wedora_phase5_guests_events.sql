-- ============================================================================
-- WEDORA PHASE 5: GUEST MANAGEMENT AND MULTIPLE WEDDING EVENTS
-- Migration: 20261028000000_wedora_phase5_guests_events.sql
-- Description: Creates wedding_guests and wedding_events tables with strict
--              multi-tenant Row Level Security (RLS) policies.
-- ============================================================================

-- ============================================================================
-- 1. AUTHORIZATION HELPER FUNCTION
-- ============================================================================

-- Helper to verify if the authenticated user has edit privileges on the wedding.
-- Owners, partners, and collaborators have content editing access; viewers are read-only.
CREATE OR REPLACE FUNCTION public.can_manage_wedding_content(p_wedding_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wedding_members
    WHERE wedding_id = p_wedding_id
      AND user_id = (SELECT auth.uid())
      AND role IN ('owner', 'partner', 'collaborator')
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_wedding_content(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_wedding_content(UUID) TO authenticated;

-- ============================================================================
-- 2. WEDDING_GUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wedding_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  household_name TEXT,
  invitation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (invitation_status IN ('pending', 'invited', 'confirmed', 'declined')),
  dietary_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Foreign key & search index
CREATE INDEX IF NOT EXISTS idx_wedding_guests_wedding_id ON public.wedding_guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_status ON public.wedding_guests(wedding_id, invitation_status);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_household ON public.wedding_guests(wedding_id, household_name);

-- Automated updated_at trigger
DROP TRIGGER IF EXISTS trg_wedding_guests_updated_at ON public.wedding_guests;
CREATE TRIGGER trg_wedding_guests_updated_at
  BEFORE UPDATE ON public.wedding_guests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. WEDDING_EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wedding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Foreign key & chronology index
CREATE INDEX IF NOT EXISTS idx_wedding_events_wedding_id ON public.wedding_events(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_events_date ON public.wedding_events(wedding_id, event_date);

-- Automated updated_at trigger
DROP TRIGGER IF EXISTS trg_wedding_events_updated_at ON public.wedding_events;
CREATE TRIGGER trg_wedding_events_updated_at
  BEFORE UPDATE ON public.wedding_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Disallow public and anon access completely
REVOKE ALL ON public.wedding_guests FROM PUBLIC, anon;
REVOKE ALL ON public.wedding_events FROM PUBLIC, anon;

-- Grant permissions strictly to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_guests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_events TO authenticated;

-- Enable RLS
ALTER TABLE public.wedding_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policies for wedding_guests
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "wedding_guests_select_member" ON public.wedding_guests;
CREATE POLICY "wedding_guests_select_member"
  ON public.wedding_guests FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

DROP POLICY IF EXISTS "wedding_guests_insert_authorized" ON public.wedding_guests;
CREATE POLICY "wedding_guests_insert_authorized"
  ON public.wedding_guests FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_wedding_content(wedding_id));

DROP POLICY IF EXISTS "wedding_guests_update_authorized" ON public.wedding_guests;
CREATE POLICY "wedding_guests_update_authorized"
  ON public.wedding_guests FOR UPDATE
  TO authenticated
  USING (public.can_manage_wedding_content(wedding_id))
  WITH CHECK (public.can_manage_wedding_content(wedding_id));

DROP POLICY IF EXISTS "wedding_guests_delete_authorized" ON public.wedding_guests;
CREATE POLICY "wedding_guests_delete_authorized"
  ON public.wedding_guests FOR DELETE
  TO authenticated
  USING (public.can_manage_wedding_content(wedding_id));

-- ----------------------------------------------------------------------------
-- Policies for wedding_events
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "wedding_events_select_member" ON public.wedding_events;
CREATE POLICY "wedding_events_select_member"
  ON public.wedding_events FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

DROP POLICY IF EXISTS "wedding_events_insert_authorized" ON public.wedding_events;
CREATE POLICY "wedding_events_insert_authorized"
  ON public.wedding_events FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_wedding_content(wedding_id));

DROP POLICY IF EXISTS "wedding_events_update_authorized" ON public.wedding_events;
CREATE POLICY "wedding_events_update_authorized"
  ON public.wedding_events FOR UPDATE
  TO authenticated
  USING (public.can_manage_wedding_content(wedding_id))
  WITH CHECK (public.can_manage_wedding_content(wedding_id));

DROP POLICY IF EXISTS "wedding_events_delete_authorized" ON public.wedding_events;
CREATE POLICY "wedding_events_delete_authorized"
  ON public.wedding_events FOR DELETE
  TO authenticated
  USING (public.can_manage_wedding_content(wedding_id));
