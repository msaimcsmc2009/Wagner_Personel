-- ===========================================================================
-- 0005_roles_grants_and_write.sql
--
-- Roller, tablo izinleri ve TEK atomik yazma yolu.
--
-- Bu migration üç kırık birden giderir:
--
--   1) `profiles` tablosunda HİÇBİR rolün GRANT'i yoktu. `anon`,
--      `authenticated` ve `service_role` için `42501 permission denied`
--      dönüyordu. Sonuç: frontend rolü okuyamıyor (`role = null`), backend
--      `requireAdmin` her istekte 403 veriyordu ve admin-only ekranlar
--      kullanıcıyı dashboard'a geri yönlendiriyordu.
--
--   2) `profiles` DOLDURULMUYORDU. `0002` yalnızca tablo ve politika
--      tanımlar; yeni bir `auth.users` kaydı için profil satırı üreten bir
--      trigger yoktu. Dolayısıyla kimse `admin` rolüne yükseltilemiyordu.
--
--   3) Yazma yolu çalışmıyordu. `0003`'teki `update_staff_count_admin`
--      fonksiyonu `service_role` için EXECUTE izni olmadan tanımlanmıştı
--      (`REVOKE ... FROM PUBLIC` + yalnızca `authenticated`'a GRANT) ve
--      fonksiyon gövdesi `auth.uid()` bekliyordu; backend ise `service_role`
--      anahtarıyla çağırıyor, `auth.uid()` orada `NULL` döndüğü için
--      fonksiyon "Authentication required" ile patlıyordu.
--
-- ⚠ GRANT'ler bilerek AÇIKÇA yazıldı. Supabase `ALTER DEFAULT PRIVILEGES`
--   ayarları projeye göre değişebiliyor; varsayılanlara güvenmek bu
--   migration'ın yazılma sebebidir. Tekrar çalıştırmak güvenlidir (idempotent).
--
-- ⚠ UYGULAMA SONRASI: PostgREST şema önbelleğini yenile.
--   `NOTIFY pgrst, 'reload schema';`
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1) Tablo izinleri
-- ---------------------------------------------------------------------------
--
-- `anon` BİLEREK GRANT ALMAZ. Bu uygulamada tarayıcı hiçbir tabloya
-- doğrudan bağlanmaz; tüm veri backend API üzerinden geçer (README
-- "Güvenlik" bölümü). RLS politikaları `authenticated` için tanımlıdır ve
-- PostgREST'in bu politikaları DEĞERLENDİREBİLMESİ için `authenticated`
-- rolünün `profiles` üzerinde SELECT izni olmalıdır: politikaların
-- `EXISTS (SELECT 1 FROM profiles ...)` alt sorgusu, sorguyu yapan rolün
-- yetkisiyle çalışır.

GRANT SELECT ON profiles TO authenticated;
GRANT ALL    ON profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON staff_counts        TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_count_history TO service_role;

GRANT SELECT ON staff_counts        TO authenticated;
GRANT SELECT ON staff_count_history TO authenticated;

COMMENT ON TABLE profiles IS
  'Supabase Auth kullanıcılarına ait uygulama profili (rol ve tam ad). '
  'Yeni kullanıcı satırları handle_new_user trigger''ı ile otomatik oluşur.';


-- ---------------------------------------------------------------------------
-- 2) Yeni kullanıcı profili — handle_new_user
-- ---------------------------------------------------------------------------
--
-- `SECURITY DEFINER` ZORUNLUDUR: trigger, `auth.users` üzerinde çalışır ve
-- tabloyu ekleyen rol `authenticated`'ın yetkisine sahip değildir.
--
-- `SET search_path` ZORUNLUDUR: güvenlik açığı önleme standardıdır; fonksiyon
-- gövdesindeki her tablo referansı arama yolundaki bir nesne tarafından
-- gölgelenebilir.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Ad, önce user_metadata'dan; yoksa e-posta'nın @ öncesi kısmından üretilir.
  -- `full_name` NOT NULL'dur ve kayıt `email` alanı zorunlu olduğu için en kötü
  -- durumda bile boş string yerine anlamlı bir değer yazılır.
  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), '')
  );

  IF v_full_name IS NULL THEN
    v_full_name := 'Kullanıcı';
  END IF;

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, v_full_name, 'user')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'auth.users INSERT sonrası çalışır; her yeni kullanıcıya role=''user'' profili açar. '
  'Rolt yükseltme (admin) YALNIZCA uygulama dışından, kontrollü biçimde yapılır.';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 2b) Mevcut kullanıcılar için geriye dönük profil
-- ---------------------------------------------------------------------------
--
-- Trigger yalnızca YENİ kayıtları yakalar. Bu migration'dan önce açılmış
-- oturumların profili olmayabilir; onlar olmadan da sisteme giremezler.

INSERT INTO public.profiles (id, full_name, role)
SELECT
  u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(split_part(COALESCE(u.email, ''), '@', 1), ''),
    'Kullanıcı'
  ),
  'user'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 3) Atomik yazma yolu — record_staff_count
-- ---------------------------------------------------------------------------
--
-- GÜNCEL + GEÇMİŞ tek transaction'da yazılır. İki ayrı PostgREST çağrısı
-- atılırsa araya hata girer ve geçmiş ile güncel değer tutarsızlaşır.
--
-- `p_actor` NEDEN VAR: `auth.uid()`, backend `service_role` anahtarıyla
-- çağrıldığında `NULL`'dur. Yani yetkiyi içeride `auth.uid()` ile
-- doğrulamak MÜMKÜN DEĞİLDİR — 0003'teki hatanın kaynağı budur. Yetki
-- burada açık bir parametreyle verilir ve `profiles.role` üzerinden kontrol
-- edilir. Backend `requireAdmin` aynı kontrolü istek başında yapar; bu ikinci
-- kontrol savunma derinliğidir, tek kontrol noktası değildir.
--
-- ⚠ Doğrulama hataları 22023 (invalid_parameter_value) ile yükseltilir.
--   `staff_counts` üzerindeki CHECK kısıtı ise 23514 üretir. Backend her
--   ikisini de 422'ye çevirir.

CREATE OR REPLACE FUNCTION public.record_staff_count(
  p_category TEXT,
  p_headcount INTEGER,
  p_actor UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_actor IS NULL THEN
    RAISE EXCEPTION 'Yetkili kullanıcı belirtilmedi'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_actor AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Bu işlem için yönetici yetkisi gerekiyor'
      USING ERRCODE = '42501';
  END IF;

  IF p_category NOT IN ('Üretim', 'Endirekt') THEN
    RAISE EXCEPTION 'Geçersiz kategori'
      USING ERRCODE = '22023';
  END IF;

  IF p_headcount IS NULL OR p_headcount < 0 OR p_headcount > 100000 THEN
    RAISE EXCEPTION 'Geçersiz personel sayısı'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO staff_counts (category, headcount, updated_at)
  VALUES (p_category, p_headcount, now())
  ON CONFLICT (category) DO UPDATE SET
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
    p_actor
  );
END;
$$;

COMMENT ON FUNCTION public.record_staff_count(TEXT, INTEGER, UUID) IS
  'Bir kategorinin personel sayısını günceller ve geçmişe kayıt ekler. '
  'Tek transaction, admin zorunlu. Güncel değer ve geçmiş birbirinden ayrılamaz.';

REVOKE ALL ON FUNCTION public.record_staff_count(TEXT, INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_staff_count(TEXT, INTEGER, UUID) TO service_role;


-- ---------------------------------------------------------------------------
-- 3b) Eski fonksiyonun düşürülmesi
-- ---------------------------------------------------------------------------
--
-- İki isimli, tek işlevli iki fonksiyon yanlış çağrıların kaynağıdır: kod
-- `update_staff_count_admin`'i çağırıyordu, repository ise hiç var olmayan
-- `record_staff_count`'i. Artık tek yol var: `record_staff_count`.

DROP FUNCTION IF EXISTS public.update_staff_count_admin(TEXT, INTEGER);


-- ---------------------------------------------------------------------------
-- 4) Geçmiş kaydının kullanıcıyla ilişkilendirilmesi
-- ---------------------------------------------------------------------------
--
-- NOT: `staff_count_history.recorded_by` ile `profiles` arasında DOĞRUDAN
-- foreign key YOKTUR ve olmayacaktır. İkisi de `auth.users`'a bağlı iki ayrı
-- tablodur; PostgREST aralarındaki ilişkiyi yalnızca ortak bir FK üzerinden
-- çözebilir. Bu yüzden `profiles:profiles!fkey (full_name)` biçiminde gömülü
-- (embedded) join KULLANILAMAZ — sunucu `PGRST200` döner. Geçmiş kayıtlarının
-- adı iki adımda çözülür: önce kayıtlar, sonra `profiles` satırları.

COMMENT ON COLUMN staff_count_history.recorded_by IS
  'Değişikliği yapan kullanıcının auth.users ID''si. profiles tablosuyla gömülü '
  'join KURULAMAZ (ortak FK yok); ad çözümü uygulamada iki adımda yapılır.';


-- ---------------------------------------------------------------------------
-- 5) PostgREST şema önbelleği
-- ---------------------------------------------------------------------------
--
-- GRANT ve fonksiyon değişiklikleri PostgREST'in şema önbelleğine yansımaz;
-- yeni imzaya sahip bir RPC'yi görmezse `PGRST202` döner.

NOTIFY pgrst, 'reload schema';