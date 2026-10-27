-- ============================================================================
-- WEDORA PHASE 3: PRODUCTION DATABASE FOUNDATION (FINAL REVISED)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLE DEFINITIONS
-- ============================================================================

-- PROFILES: Strictly limited to collaboration display metadata.
-- User email and credentials remain encapsulated in auth.users.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- WEDDINGS: Core wedding workspace entity.
CREATE TABLE IF NOT EXISTS public.weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  wedding_date DATE,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX IF NOT EXISTS idx_weddings_creator ON public.weddings(creator_id);

-- WEDDING_MEMBERS: Multi-tenant role junction.
CREATE TABLE IF NOT EXISTS public.wedding_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'partner', 'collaborator', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_wedding_member UNIQUE (wedding_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wedding_members_lookup ON public.wedding_members(wedding_id, user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_members_user ON public.wedding_members(user_id);

-- ============================================================================
-- 3. TIMESTAMP AUTOMATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_weddings_updated_at ON public.weddings;
CREATE TRIGGER trg_weddings_updated_at
  BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_wedding_members_updated_at ON public.wedding_members;
CREATE TRIGGER trg_wedding_members_updated_at
  BEFORE UPDATE ON public.wedding_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. HARDENED SECURITY DEFINER AUTHORIZATION HELPERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_wedding_member(p_wedding_id UUID)
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
  );
$$;

CREATE OR REPLACE FUNCTION public.is_wedding_owner(p_wedding_id UUID)
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
      AND role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_wedding_details(p_wedding_id UUID)
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
      AND role IN ('owner', 'partner')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_wedding_comember(p_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wedding_members m_self
    JOIN public.wedding_members m_peer ON m_self.wedding_id = m_peer.wedding_id
    WHERE m_self.user_id = (SELECT auth.uid())
      AND m_peer.user_id = p_target_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_wedding_member(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_wedding_member(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.is_wedding_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_wedding_owner(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.can_edit_wedding_details(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_wedding_details(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.is_wedding_comember(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_wedding_comember(UUID) TO authenticated;

-- ============================================================================
-- 5. BUSINESS INTEGRITY TRIGGERS & PROCEDURES
-- ============================================================================

-- Trigger 5.1: Profile auto-provisioning
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger 5.2: Atomic assignment of wedding creator as initial owner
CREATE OR REPLACE FUNCTION public.handle_wedding_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.wedding_members (wedding_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'owner');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_wedding_created ON public.weddings;
CREATE TRIGGER on_wedding_created
  AFTER INSERT ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.handle_wedding_created();

-- Trigger 5.3: Immutability of wedding creator_id
CREATE OR REPLACE FUNCTION public.protect_wedding_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.creator_id <> OLD.creator_id THEN
    RAISE EXCEPTION 'The original wedding creator cannot be modified.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_wedding_creator ON public.weddings;
CREATE TRIGGER trg_protect_wedding_creator
  BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.protect_wedding_creator();

-- Trigger 5.4: Immutability of user_id and wedding_id on memberships
CREATE OR REPLACE FUNCTION public.protect_membership_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Membership user_id cannot be changed.'
      USING ERRCODE = 'P0001';
  END IF;
  IF NEW.wedding_id <> OLD.wedding_id THEN
    RAISE EXCEPTION 'Membership wedding_id cannot be changed.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_membership_identity ON public.wedding_members;
CREATE TRIGGER trg_protect_membership_identity
  BEFORE UPDATE ON public.wedding_members
  FOR EACH ROW EXECUTE FUNCTION public.protect_membership_identity();

-- Trigger 5.5: Concurrency-safe orphan prevention on role demotion
CREATE OR REPLACE FUNCTION public.prevent_orphan_wedding()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_remaining_owners INT;
  v_lock_key BIGINT;
BEGIN
  -- Evaluate only when an owner is being demoted to a non-owner role
  IF OLD.role = 'owner' AND NEW.role <> 'owner' THEN
    v_lock_key := ('x' || pg_catalog.substr(pg_catalog.replace(OLD.wedding_id::text, '-', ''), 1, 16))::bit(64)::bigint;
    PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_key);

    SELECT pg_catalog.count(*) INTO v_remaining_owners
    FROM public.wedding_members
    WHERE wedding_id = OLD.wedding_id
      AND role = 'owner'
      AND id <> OLD.id;

    IF v_remaining_owners = 0 THEN
      RAISE EXCEPTION 'Cannot demote the sole owner of an active wedding. Assign another owner before removing this ownership.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_orphan_wedding ON public.wedding_members;
CREATE TRIGGER trg_prevent_orphan_wedding
  BEFORE UPDATE OF role ON public.wedding_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_orphan_wedding();

-- Trigger 5.6: Protect against account deletions that leave active weddings ownerless
CREATE OR REPLACE FUNCTION public.protect_profile_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.wedding_members m1
    WHERE m1.user_id = OLD.id
      AND m1.role = 'owner'
      AND (
        SELECT pg_catalog.count(*)
        FROM public.wedding_members m2
        WHERE m2.wedding_id = m1.wedding_id
          AND m2.role = 'owner'
      ) = 1
  ) THEN
    RAISE EXCEPTION 'Cannot delete account while being the sole owner of an active wedding. Appoint another owner or delete the wedding first.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_deletion ON public.profiles;
CREATE TRIGGER trg_protect_profile_deletion
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_deletion();

-- Procedure 5.7: Atomic ownership transfer (RPC)
CREATE OR REPLACE FUNCTION public.transfer_wedding_ownership(
  p_wedding_id UUID,
  p_new_owner_user_id UUID,
  p_old_owner_new_role TEXT DEFAULT 'partner'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lock_key BIGINT;
BEGIN
  -- Caller must be an active owner of the target wedding
  IF NOT public.is_wedding_owner(p_wedding_id) THEN
    RAISE EXCEPTION 'Only an active owner can transfer wedding ownership.'
      USING ERRCODE = '42501';
  END IF;

  -- Validate demotion role
  IF p_old_owner_new_role NOT IN ('partner', 'collaborator', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role for previous owner.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Target new owner must be an existing member of the wedding
  IF NOT EXISTS (
    SELECT 1 FROM public.wedding_members
    WHERE wedding_id = p_wedding_id AND user_id = p_new_owner_user_id
  ) THEN
    RAISE EXCEPTION 'Target user must be an existing member of the wedding.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Acquire transaction-scoped advisory lock for this wedding
  v_lock_key := ('x' || pg_catalog.substr(pg_catalog.replace(p_wedding_id::text, '-', ''), 1, 16))::bit(64)::bigint;
  PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_key);

  -- Step 1: Promote new owner
  UPDATE public.wedding_members
  SET role = 'owner'
  WHERE wedding_id = p_wedding_id AND user_id = p_new_owner_user_id;

  -- Step 2: Demote caller
  UPDATE public.wedding_members
  SET role = p_old_owner_new_role
  WHERE wedding_id = p_wedding_id AND user_id = (SELECT auth.uid());
END;
$$;

-- Revoke execute permissions on internal trigger functions
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_wedding_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_wedding_creator() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_membership_identity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_orphan_wedding() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_deletion() FROM PUBLIC, anon, authenticated;

-- Grant execute on the atomic ownership transfer procedure to authenticated clients
REVOKE ALL ON FUNCTION public.transfer_wedding_ownership(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_wedding_ownership(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- 6. EXPLICIT TABLE PRIVILEGES (LEAST PRIVILEGE)
-- ============================================================================

REVOKE ALL ON public.profiles FROM PUBLIC, anon;
REVOKE ALL ON public.weddings FROM PUBLIC, anon;
REVOKE ALL ON public.wedding_members FROM PUBLIC, anon;

-- Profiles: Authenticated users can read co-members and update own display data
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Weddings: Authenticated users can manage their own wedding workspaces
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weddings TO authenticated;

-- Wedding Members: NO client INSERT permission in Phase 3. Only SELECT, UPDATE, DELETE.
GRANT SELECT, UPDATE, DELETE ON public.wedding_members TO authenticated;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_members ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_select_comembers" ON public.profiles;
CREATE POLICY "profiles_select_comembers"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_wedding_comember(id));

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- WEDDINGS
DROP POLICY IF EXISTS "weddings_select_member" ON public.weddings;
CREATE POLICY "weddings_select_member"
  ON public.weddings FOR SELECT
  TO authenticated
  USING (
    creator_id = (SELECT auth.uid()) OR
    public.is_wedding_member(id)
  );

DROP POLICY IF EXISTS "weddings_insert_self" ON public.weddings;
CREATE POLICY "weddings_insert_self"
  ON public.weddings FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    creator_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "weddings_update_authorized" ON public.weddings;
CREATE POLICY "weddings_update_authorized"
  ON public.weddings FOR UPDATE
  TO authenticated
  USING (public.can_edit_wedding_details(id))
  WITH CHECK (public.can_edit_wedding_details(id));

DROP POLICY IF EXISTS "weddings_delete_owner" ON public.weddings;
CREATE POLICY "weddings_delete_owner"
  ON public.weddings FOR DELETE
  TO authenticated
  USING (public.is_wedding_owner(id));

-- WEDDING_MEMBERS (Zero Client INSERT Policy)
DROP POLICY IF EXISTS "wedding_members_select" ON public.wedding_members;
CREATE POLICY "wedding_members_select"
  ON public.wedding_members FOR SELECT
  TO authenticated
  USING (public.is_wedding_member(wedding_id));

DROP POLICY IF EXISTS "wedding_members_update_owner" ON public.wedding_members;
CREATE POLICY "wedding_members_update_owner"
  ON public.wedding_members FOR UPDATE
  TO authenticated
  USING (public.is_wedding_owner(wedding_id))
  WITH CHECK (public.is_wedding_owner(wedding_id));

-- Direct client deletion of owner memberships is strictly forbidden (role <> 'owner')
DROP POLICY IF EXISTS "wedding_members_delete_non_owner" ON public.wedding_members;
CREATE POLICY "wedding_members_delete_non_owner"
  ON public.wedding_members FOR DELETE
  TO authenticated
  USING (
    role <> 'owner' AND
    (
      public.is_wedding_owner(wedding_id) OR
      user_id = (SELECT auth.uid())
    )
  );
