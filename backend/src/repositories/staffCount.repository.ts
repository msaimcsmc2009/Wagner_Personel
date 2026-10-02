import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import {
  STAFF_CATEGORIES,
  type StaffCountHistoryRow,
  type StaffCountRow,
  type StaffCategory,
} from '../types/staffCount.js';

/**
 * Personel sayısı veri erişimi.
 *
 * Katman sözleşmesi (`routes/index.ts` yorumunda tanımlı):
 *   routes → controllers → services → repositories → Supabase
 *
 * SORUMLULUK: satır (snake_case) ↔ domain (camelCase) dönüşümü ve veritabanı
 * hatalarının `AppError`'a çevrilmesi. Servis katmanı `*Row` görmez.
 *
 * ⚠ TİPLEME — buradaki `overrideTypes` / `.single<T>()` daraltmaları
 * geçicidir. `supabase gen types typescript` ile üretilen `Database` tipi
 * `getSupabaseClient()`'a geçirildiğinde bunlar silinebilir. Dönüşüm
 * sorumluluğu bilinçli olarak bu katmanda tutulur, `any` üzerinden
 * geçilmez.
 */

/**
 * Veritabanı hatalarını `AppError`'a çevirir.
 *
 * Supabase `{ error }` döndürür, `throw` etmez. Sessizce yutulursa controller
 * boş veri görür ve kullanıcıya "kayıt yok" yerine yanlış bir tablo gösterilir.
 * Bu yüzden HER sorgu bu fonksiyondan geçer.
 *
 * PostgREST kodu `23514` (check_violation) CHECK kısıtı ihlali içerir; bu
 * migration'daki kategori/sayı doğrulamalarından gelir ve 422 olarak döner.
 * Ham SQL hata metni istemciye SIZDIRILMAZ.
 */
function assertNoDbError(error: { code: string; message: string } | null): void {
  if (error === null) return;

  if (error.code === '23514') {
    throw new AppError(
      422,
      'CONSTRAINT_VIOLATION',
      'Girilen bilgiler geçersiz. Kategoriyi ve personel sayısını kontrol edin.',
    );
  }

  if (error.code === '42883') {
    // 42883 (undefined_function): migration uygulanmamışsa
    // `record_staff_count` bulunamaz. Bu bir yapılandırma hatasıdır,
    // kullanıcının hatası değil.
    logger.error('Beklenen veritabanı fonksiyonu bulunamadı', {
      code: error.code,
      message: error.message,
      migration: '0005_roles_grants_and_write.sql',
    });
    throw new AppError(
      503,
      'MIGRATION_NOT_APPLIED',
      'Veritabanı şeması güncel değil. Migration uygulanmadan yazma yapılamaz.',
    );
  }

  if (error.code === '42501') {
    // 42501: profil yok ya da admin değil; ayrıca EXECUTE grant'ı
    // eksikse de aynı kod döner.
    logger.warn('Veritabanı yazma yetkisi reddedildi', {
      code: error.code,
      message: error.message,
    });
    throw new AppError(
      403,
      'FORBIDDEN',
      'Bu işlemi gerçekleştirmek için yönetici yetkisi gerekiyor.',
    );
  }

  if (error.code === '22023' || error.code === '23514') {
    // 22023 (invalid_parameter_value) fonksiyonun kendi doğrulamasından,
    // 23514 (check_violation) `staff_counts` CHECK kısıtından gelir.
    // Kullanıcıya ikisi de "geçersiz veri" demektir.
    throw new AppError(
      422,
      'CONSTRAINT_VIOLATION',
      'Girilen bilgiler geçersiz. Kategoriyi ve personel sayısını kontrol edin.',
    );
  }

  if (error.code === '42P01') {
    // 42P01 (undefined_table): tablo yok.
    logger.error('Beklenen tablo bulunamadı', { code: error.code, message: error.message });
    throw new AppError(
      503,
      'MIGRATION_NOT_APPLIED',
      'Veritabanı şeması güncel değil. Migration uygulanmadan veri okunamaz.',
    );
  }

  logger.error('Veritabanı hatası', { code: error.code, message: error.message });
  throw new AppError(
    500,
    'DATABASE_ERROR',
    'Veri kaynağına ulaşılamadı. Lütfen tekrar deneyin.',
  );
}

/**
 * Güncel sayıları okur.
 *
 * Sıralama veritabanına bırakılmaz: iki satır vardır ve sıra sabittir.
 * Sonuç, `STAFF_CATEGORIES` sırasına göre `STAFF_CATEGORIES` ile eşleşen
 * sırada döndürülür — böylece veritabanında eksik bir satır olsa bile
 * istemci sabit bir dizi uzunluğu görür ve arayüzde "kayıt yok" durumu
 * oluşmaz.
 */
export async function listStaffCounts(
  client: SupabaseClient = getSupabaseClient(),
): Promise<StaffCountRow[]> {
  const { data, error } = await client
    .from('staff_counts')
    .select('category, headcount, updated_at')
    .overrideTypes<StaffCountRow[]>();

  assertNoDbError(error);

  const rows = data ?? [];
  const byCategory = new Map(rows.map((row) => [row.category, row]));

  // Sonuç, `STAFF_CATEGORIES` sırasına göre döndürülür; veritabanı sırası
  // garantisi yoktur ve arayüzün sırası sabit olmalıdır.
  //
  // Eksik kategoriler 0 olarak döner: başlangıç seed'i ikisini de oluşturur,
  // ama bir satır yanlışlıkla silinmişse ekran boş kalmak yerine 0 gösterir
  // ve kullanıcı değeri yeniden girebilir.
  return STAFF_CATEGORIES.map(
    (category) =>
      byCategory.get(category) ?? {
        category,
        headcount: 0,
        updated_at: new Date(0).toISOString(),
      },
  );
}

/**
 * Bir kategorinin sayısını günceller ve geçmişe kayıt ekler.
 *
 * İki yazma `record_staff_count` RPC'si tarafından TEK transaction içinde
 * yapılır. Doğrudan iki ayrı PostgREST çağrısı atılırsa araya hata girer ve
 * geçmiş ile güncel değer tutarsızlaşır.
 *
 * `p_actor` AÇIKÇA verilir: `auth.uid()`, `service_role` anahtarıyla
 * çağrıldığında `NULL` döner; yetki odak değişkeninden okunamaz.
 *
 * ⚠ Bu fonksiyon `0005_roles_grants_and_write.sql` migration'ıyla tanımlanır.
 *   Migration uygulanmazsa PostgREST `PGRST202` döner ve `assertNoDbError`
 *   bunu 503'e çevirir — kullanıcıya "kaydedilemedi" demek yerine
 *   "migration uygulanmalı" demek daha doğrudur.
 *
 * İsteğe bağlı: `department`/`personnel` gibi bir kayıt oluşturulmaz. Yalnız
 * iki satırdan birinin sayısı güncellenir.
 */
export async function recordStaffCount(
  category: StaffCategory,
  headcount: number,
  actorId: string,
  client: SupabaseClient = getSupabaseClient(),
): Promise<void> {
  const { error } = await client.rpc('record_staff_count', {
    p_category: category,
    p_headcount: headcount,
    p_actor: actorId,
  });

  assertNoDbError(error);
}

/**
 * Geçmiş kayıtları okur.
 *
 * `limit` verilmezse migration'daki varsayılan uygulanır. Sıralama en yeniden
 * başa; `staff_count_history_category_time_idx` indeksini kullanır.
 *
 * Bu kayıtlar SİLİNMEZ; bir silme fonksiyonu BİLEREK tanımlanmamıştır.
 */
export async function listStaffCountHistory(
  options: { category?: StaffCategory | undefined; limit: number },
  client: SupabaseClient = getSupabaseClient(),
): Promise<StaffCountHistoryRow[]> {
  let builder = client
    .from('staff_count_history')
    .select('id, category, headcount, recorded_at, recorded_month');

  if (options.category !== undefined) {
    builder = builder.eq('category', options.category);
  }

  const { data, error } = await builder
    .order('recorded_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(options.limit)
    .overrideTypes<StaffCountHistoryRow[]>();

  assertNoDbError(error);

  return data ?? [];
}
