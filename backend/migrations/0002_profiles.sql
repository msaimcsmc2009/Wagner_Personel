-- ===========================================================================
-- 0002_profiles.sql
-- Profiles tablosu ve RLS politikaları (auth.users ile 1:1)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Supabase Auth kullanıcılarına ait uygulama profili (rol ve tam ad).';
COMMENT ON COLUMN profiles.role IS 'Kullanıcı rolü: admin | user';

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: kendi profilini görebilir, admin tümünü görebilir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_select_self_or_admin'
  ) THEN
    CREATE POLICY profiles_select_self_or_admin
      ON profiles
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL AND (
          id = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        )
      );
  END IF;
END$$;

-- UPDATE: sadece kendi profili (full_name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_self_name'
  ) THEN
    CREATE POLICY profiles_update_self_name
      ON profiles
      FOR UPDATE
      USING (auth.uid() IS NOT NULL AND id = auth.uid())
      WITH CHECK (
        auth.uid() IS NOT NULL AND id = auth.uid() AND
        role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid())
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_update_admin_role'
  ) THEN
    CREATE POLICY profiles_update_admin_role
      ON profiles
      FOR UPDATE
      USING (
        auth.uid() IS NOT NULL AND EXISTS (
          SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
      WITH CHECK (
        auth.uid() IS NOT NULL AND EXISTS (
          SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END$$;

-- INSERT: sadece admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_insert_admin'
  ) THEN
    CREATE POLICY profiles_insert_admin
      ON profiles
      FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL AND EXISTS (
          SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END$$;

-- DELETE: sadece admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_delete_admin'
  ) THEN
    CREATE POLICY profiles_delete_admin
      ON profiles
      FOR DELETE
      USING (
        auth.uid() IS NOT NULL AND EXISTS (
          SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END$$;