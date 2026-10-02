-- ===========================================================================
-- Wagner Kablo Personel — 0001 başlangıç şeması
--
-- Uygulama:  Supabase (PostgreSQL)
-- Kapsam:    YALNIZCA personel SAYISI (aggregate).
--
-- KAPSAM NOTU — bu şemada bilinçli olarak BULUNMAYANLAR:
--   * Personel kaydı (ad, sicil, e-posta, telefon, doğum tarihi...) YOK.
--   * Departman tablosu/sistemi YOK.
--   * İzin (leave) ve eğitim (training) tabloları/sistemleri YOK.
--   * Vardiya, durum, eğitim seviyesi alanları YOK.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- updated_at otomatik güncellemesi
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_updated_at() IS
  'updated_at kolonunu yazan ortak tetikleyici fonksiyonu.';


-- ---------------------------------------------------------------------------
-- staff_counts — güncel değerler
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS staff_counts (
  category    TEXT        PRIMARY KEY,
  headcount   INTEGER     NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT staff_counts_category_check
    CHECK (category IN ('Üretim', 'Endirekt')),

  CONSTRAINT staff_counts_headcount_check
    CHECK (headcount >= 0 AND headcount <= 100000)
);

COMMENT ON TABLE staff_counts IS
  'Güncel personel sayıları. Kategori başına tam olarak bir satır. '
  'Toplam SUM(headcount) ile hesaplanır, saklanmaz.';

COMMENT ON COLUMN staff_counts.category IS
  'Sayım yapılan grup: Üretim | Endirekt. Personel kaydı DEĞİLDİR.';

COMMENT ON COLUMN staff_counts.headcount IS
  'O gruptaki güncel personel sayısı.';


DROP TRIGGER IF EXISTS staff_counts_set_updated_at ON staff_counts;

CREATE TRIGGER staff_counts_set_updated_at
  BEFORE UPDATE ON staff_counts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- staff_count_history — geçmiş kayıtlar (SİLİNMEZ)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS staff_count_history (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category      TEXT NOT NULL,
  headcount     INTEGER NOT NULL,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Generated column yerine normal kolon + trigger kullanıyoruz.
  -- PostgreSQL'de date_trunc('month', timestamptz) generated expression
  -- için immutable olmadığı için generated column kullanılamaz.
  recorded_month DATE NOT NULL,

  CONSTRAINT staff_count_history_category_check
    CHECK (category IN ('Üretim', 'Endirekt')),

  CONSTRAINT staff_count_history_headcount_check
    CHECK (headcount >= 0 AND headcount <= 100000)
);

COMMENT ON TABLE staff_count_history IS
  'Personel sayısı değişiklik geçmişi. Append-only; kayıtlar silinmez veya '
  'güncellenmez. Yalnız backend API üzerinden yazılır.';


-- ---------------------------------------------------------------------------
-- recorded_month otomatik doldurma
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_recorded_month()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.recorded_month := date_trunc('month', NEW.recorded_at)::date;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS staff_count_history_set_recorded_month
  ON staff_count_history;

CREATE TRIGGER staff_count_history_set_recorded_month
  BEFORE INSERT ON staff_count_history
  FOR EACH ROW
  EXECUTE FUNCTION set_recorded_month();


-- ---------------------------------------------------------------------------
-- Indexler
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS staff_count_history_category_time_idx
  ON staff_count_history (category, recorded_at DESC);

CREATE INDEX IF NOT EXISTS staff_count_history_month_idx
  ON staff_count_history (recorded_month DESC);


-- ---------------------------------------------------------------------------
-- Başlangıç verisi
-- ---------------------------------------------------------------------------

INSERT INTO staff_counts (category, headcount)
VALUES
  ('Üretim', 0),
  ('Endirekt', 0)
ON CONFLICT (category) DO NOTHING;


-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE staff_counts
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE staff_count_history
  ENABLE ROW LEVEL SECURITY;

-- 0001'de bilinçli olarak politika tanımlanmıyor.
-- 0003 migration'ında Auth/RBAC politikaları eklenecek.

COMMENT ON TABLE staff_counts IS
  'Güncel personel sayıları. Erişim yalnızca backend API üzerinden; '
  'RLS açık ve 0001 aşamasında politikasızdır.';

COMMENT ON TABLE staff_count_history IS
  'Personel sayısı değişiklik geçmişi. Append-only; RLS açık ve '
  '0001 aşamasında politikasızdır.';