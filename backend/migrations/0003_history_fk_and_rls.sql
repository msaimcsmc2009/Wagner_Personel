-- 0003_history_fk_and_rls.sql

-- recorded_by kolonu yoksa ekle
ALTER TABLE staff_count_history
ADD COLUMN IF NOT EXISTS recorded_by UUID;

-- recorded_by -> auth.users foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'staff_count_history_recorded_by_fkey'
  ) THEN
    ALTER TABLE staff_count_history
      ADD CONSTRAINT staff_count_history_recorded_by_fkey
      FOREIGN KEY (recorded_by)
      REFERENCES auth.users(id)
      ON DELETE RESTRICT;
  END IF;
END
$$;

-- staff_counts RLS
CREATE POLICY "Authenticated users can view staff counts"
ON staff_counts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can update staff counts"
ON staff_counts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- history RLS
CREATE POLICY "Authenticated users can view history"
ON staff_count_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert history"
ON staff_count_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- Admin-only atomic update function
CREATE OR REPLACE FUNCTION update_staff_count_admin(
  p_category TEXT,
  p_headcount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_category NOT IN ('Üretim', 'Endirekt') THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;

  IF p_headcount < 0 OR p_headcount > 100000 THEN
    RAISE EXCEPTION 'Invalid headcount';
  END IF;

  INSERT INTO staff_counts (category, headcount, updated_at)
  VALUES (p_category, p_headcount, now())
  ON CONFLICT (category)
  DO UPDATE SET
    headcount = EXCLUDED.headcount,
    updated_at = now();

  INSERT INTO staff_count_history (
    category,
    headcount,
    recorded_at,
    recorded_month,
    recorded_by
  )
  VALUES (
    p_category,
    p_headcount,
    now(),
    date_trunc('month', now())::date,
    auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION update_staff_count_admin(TEXT, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION update_staff_count_admin(TEXT, INTEGER)
TO authenticated;