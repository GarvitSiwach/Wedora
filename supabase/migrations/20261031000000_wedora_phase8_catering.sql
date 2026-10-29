-- ============================================================================
-- WEDORA PHASE 8: FOOD PREFERENCES & CATERING MANAGEMENT
-- Migration: 20261031000000_wedora_phase8_catering.sql
-- Description: Creates wedding_catering_plans table with event scoping,
--              status constraints, meal categories JSONB, vendor details,
--              and strict multi-tenant Row Level Security (RLS) policies.
-- ============================================================================

-- ============================================================================
-- 1. WEDDING_CATERING_PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wedding_catering_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE ON UPDATE CASCADE,
  event_id UUID REFERENCES public.wedding_events(id) ON DELETE CASCADE ON UPDATE CASCADE,
  caterer_name TEXT,
  caterer_contact_name TEXT,
  caterer_email TEXT,
  caterer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'planning', 'confirmed', 'completed')),
  service_style TEXT,
  menu_notes TEXT,
  meal_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  catering_deadline DATE,
  dietary_notes TEXT,
  special_instructions TEXT,
  budget_estimate NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Ensure at most one catering plan exists per specific event within a wedding
CREATE UNIQUE INDEX IF NOT EXISTS uq_wedding_catering_event
  ON public.wedding_catering_plans(wedding_id, event_id)
  WHERE event_id IS NOT NULL;

-- Lookup and foreign key performance indexes
CREATE INDEX IF NOT EXISTS idx_wedding_catering_wedding_id ON public.wedding_catering_plans(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_catering_event_id ON public.wedding_catering_plans(event_id);
CREATE INDEX IF NOT EXISTS idx_wedding_catering_status ON public.wedding_catering_plans(wedding_id, status);

-- ============================================================================
-- 2. AUTOMATED UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS trg_wedding_catering_plans_updated_at ON public.wedding_catering_plans;
CREATE TRIGGER trg_wedding_catering_plans_updated_at
  BEFORE UPDATE ON public.wedding_catering_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Disallow public and anon access completely; catering vendor details & food plans are strictly private
REVOKE ALL ON public.wedding_catering_plans FROM PUBLIC, anon;

-- Grant permissions strictly to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_catering_plans TO authenticated;

-- Enable RLS
ALTER TABLE public.wedding_catering_plans ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policies for wedding_catering_plans
-- ----------------------------------------------------------------------------

-- Viewers, collaborators, partners, and owners can read catering plans for their wedding
DROP POLICY IF EXISTS "wedding_catering_plans_select_member" ON public.wedding_catering_plans;
CREATE POLICY "wedding_catering_plans_select_member"
  ON public.wedding_catering_plans FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

-- Authorized collaborators, partners, and owners can create catering plans
DROP POLICY IF EXISTS "wedding_catering_plans_insert_authorized" ON public.wedding_catering_plans;
CREATE POLICY "wedding_catering_plans_insert_authorized"
  ON public.wedding_catering_plans FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_wedding_content(wedding_id));

-- Authorized collaborators, partners, and owners can update catering plans
DROP POLICY IF EXISTS "wedding_catering_plans_update_authorized" ON public.wedding_catering_plans;
CREATE POLICY "wedding_catering_plans_update_authorized"
  ON public.wedding_catering_plans FOR UPDATE
  TO authenticated
  USING (public.can_manage_wedding_content(wedding_id))
  WITH CHECK (public.can_manage_wedding_content(wedding_id));

-- Authorized collaborators, partners, and owners can delete catering plans
DROP POLICY IF EXISTS "wedding_catering_plans_delete_authorized" ON public.wedding_catering_plans;
CREATE POLICY "wedding_catering_plans_delete_authorized"
  ON public.wedding_catering_plans FOR DELETE
  TO authenticated
  USING (public.can_manage_wedding_content(wedding_id));
