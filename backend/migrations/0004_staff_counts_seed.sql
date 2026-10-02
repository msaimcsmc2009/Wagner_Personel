-- ===========================================================================
-- 0004_staff_counts_seed.sql
-- Idempotent seed (yalnızca eksikse)
-- ===========================================================================

INSERT INTO staff_counts (category, headcount)
VALUES ('Üretim', 0), ('Endirekt', 0)
ON CONFLICT (category) DO NOTHING;