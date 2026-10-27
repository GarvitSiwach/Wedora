-- ============================================================================
-- WEDORA PHASE 6: DIGITAL INVITATIONS & WEDDING WEBSITES
-- Migration: 20261029000000_wedora_phase6_websites.sql
-- Description: Creates wedding_websites table, public read access for published
--              websites and celebration events, and secure public retrieval RPC.
-- ============================================================================

-- ============================================================================
-- 1. WEDDING_WEBSITES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wedding_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL UNIQUE REFERENCES public.weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  couple_names TEXT NOT NULL,
  welcome_message TEXT,
  story TEXT,
  venue_display TEXT,
  date_display TEXT,
  template TEXT NOT NULL DEFAULT 'minimal_editorial'
    CHECK (template IN ('minimal_editorial', 'royal_indian', 'botanical_romance')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Slug normalization constraint and indexes
CREATE INDEX IF NOT EXISTS idx_wedding_websites_wedding_id ON public.wedding_websites(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_websites_slug ON public.wedding_websites(slug);
CREATE INDEX IF NOT EXISTS idx_wedding_websites_published ON public.wedding_websites(is_published);

-- Automated updated_at trigger
DROP TRIGGER IF EXISTS trg_wedding_websites_updated_at ON public.wedding_websites;
CREATE TRIGGER trg_wedding_websites_updated_at
  BEFORE UPDATE ON public.wedding_websites
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. PERMISSIONS & ROW LEVEL SECURITY
-- ============================================================================

REVOKE ALL ON public.wedding_websites FROM PUBLIC, anon;

-- Authenticated wedding editors get full CRUD; anonymous visitors get SELECT on published rows
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_websites TO authenticated;
GRANT SELECT ON public.wedding_websites TO anon;

ALTER TABLE public.wedding_websites ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policies for wedding_websites
-- ----------------------------------------------------------------------------

-- Public anonymous & authenticated can read published websites
DROP POLICY IF EXISTS "wedding_websites_select_public" ON public.wedding_websites;
CREATE POLICY "wedding_websites_select_public"
  ON public.wedding_websites FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Authorized wedding members can read their own website configuration whether published or unpublished
DROP POLICY IF EXISTS "wedding_websites_select_member" ON public.wedding_websites;
CREATE POLICY "wedding_websites_select_member"
  ON public.wedding_websites FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

DROP POLICY IF EXISTS "wedding_websites_insert_authorized" ON public.wedding_websites;
CREATE POLICY "wedding_websites_insert_authorized"
  ON public.wedding_websites FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_wedding_content(wedding_id));

DROP POLICY IF EXISTS "wedding_websites_update_authorized" ON public.wedding_websites;
CREATE POLICY "wedding_websites_update_authorized"
  ON public.wedding_websites FOR UPDATE
  TO authenticated
  USING (public.can_manage_wedding_content(wedding_id))
  WITH CHECK (public.can_manage_wedding_content(wedding_id));

DROP POLICY IF EXISTS "wedding_websites_delete_authorized" ON public.wedding_websites;
CREATE POLICY "wedding_websites_delete_authorized"
  ON public.wedding_websites FOR DELETE
  TO authenticated
  USING (public.can_manage_wedding_content(wedding_id));

-- ----------------------------------------------------------------------------
-- Public Event Access for Published Weddings
-- ----------------------------------------------------------------------------

-- Allow anonymous visitors to view events ONLY IF the wedding website is published
GRANT SELECT ON public.wedding_events TO anon;

DROP POLICY IF EXISTS "wedding_events_select_public" ON public.wedding_events;
CREATE POLICY "wedding_events_select_public"
  ON public.wedding_events FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_websites w
      WHERE w.wedding_id = wedding_events.wedding_id
        AND w.is_published = true
    )
  );

-- ============================================================================
-- 3. SECURE PUBLIC RETRIEVAL FUNCTION
-- ============================================================================

-- Function to return only explicitly public information for published weddings.
-- Never leaks internal UUIDs, guest lists, notes, or membership records.
CREATE OR REPLACE FUNCTION public.get_public_wedding_by_slug(p_slug TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT jsonb_build_object(
    'website', jsonb_build_object(
      'title', w.title,
      'couple_names', w.couple_names,
      'welcome_message', w.welcome_message,
      'story', w.story,
      'venue_display', COALESCE(w.venue_display, wed.location),
      'date_display', COALESCE(w.date_display, to_char(wed.wedding_date, 'YYYY-MM-DD')),
      'template', w.template,
      'is_published', w.is_published,
      'slug', w.slug
    ),
    'events', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'title', e.title,
            'description', e.description,
            'event_date', e.event_date,
            'start_time', e.start_time,
            'end_time', e.end_time,
            'location', e.location
          ) ORDER BY e.event_date ASC NULLS LAST, e.start_time ASC NULLS LAST
        )
        FROM public.wedding_events e
        WHERE e.wedding_id = w.wedding_id
      ),
      '[]'::jsonb
    )
  )
  FROM public.wedding_websites w
  JOIN public.weddings wed ON wed.id = w.wedding_id
  WHERE w.slug = lower(trim(p_slug))
    AND w.is_published = true;
$$;

REVOKE ALL ON FUNCTION public.get_public_wedding_by_slug(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_wedding_by_slug(TEXT) TO anon, authenticated;
