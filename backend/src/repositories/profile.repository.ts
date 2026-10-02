import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import type { ProfileRow, UserRole } from '../types/auth.js';

/**
 * Profil (rol) veri erişimi.
 *
 * Katman sözleşmesi (`routes/index.ts` yorumunda tanımlı):
 *   routes → controllers → services → repositories → Supabase
 *
 * SORUMLULUK: `profiles` satırını okumak ve satır (snake_case) ↔ domain
 * dönüşümünü yapmak. Servis katmanı Supabase sorgusu yazmaz.
 *
 * ⚠ NEDEN AYRI BİR REPOSITORY: rol birden fazla yerde çözülür (istek
 *   başındaki `requireAuth` ve `GET /api/auth/me`). İki yerde ayrı sorgu
 *   yazılırsa biri grant eksikliğiyle sessizce bozulur ve kullanıcı anlamaz
 *   bir şekilde yetkisini kaybeder. Tek sorgu, tek doğru.
 */

/**
 * Veritabanı hatalarını `AppError`'a çevirir.
 *
 * `42501` (insufficient_privilege) BURADA ÖZEL ANLAMLIDIR: `profiles`
 * tablosunda `service_role` için GRANT yoksa migration uygulanmamıştır.
 * Bu bir yetki hatası değil, KURULUM hatasıdır ve kullanıcıya "yetkiniz
 * yok" demek yanlış olur — kullanıcı her şeye yetkilidir, sistem eksik
 * kurulmuştur.
 */
function assertNoDbError(error: { code: string; message: string } | null): void {
  if (error === null) return;

  if (error.code === '42501') {
    logger.error('profiles tablosunda yetki yok', {
      code: error.code,
      message: error.message,
      migration: '0005_roles_grants_and_write.sql',
    });
    throw new AppError(
      503,
      'MIGRATION_NOT_APPLIED',
      'Veritabanı izinleri eksik. Backend migration dosyaları uygulanmalı.',
    );
  }

  if (error.code === '42P01') {
    logger.error('profiles tablosu bulunamadı', {
      code: error.code,
      message: error.message,
    });
    throw new AppError(
      503,
      'MIGRATION_NOT_APPLIED',
      'Veritabanı şeması güncel değil. Migration uygulanmalı.',
    );
  }

  logger.error('Veritabanı hatası', { code: error.code, message: error.message });
  throw new AppError(500, 'DATABASE_ERROR', 'Veri kaynağına ulaşılamadı. Lütfen tekrar deneyin.');
}

/**
 * Veritabanı rol değerini uygulama rolüne çevirir.
 *
 * CHECK kısıtı beklenmeyen bir değeri zaten engeller; buradaki kontrol
 * kısıtın bir gün gevşetilmesi hâlinde tip güvenliğini korur. Tanınmayan
 * değer `null`'a düşer — yani "yönetici" DEĞİL, sadece "bilinmiyor".
 */
function mapRole(value: unknown): UserRole | null {
  if (value === 'admin' || value === 'user') return value;
  return null;
}

/** Tek bir profil satırını okur. Satır yoksa `null` döner. */
export async function findProfileById(
  id: string,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ProfileRow | null> {
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('id', id)
    .maybeSingle();

  assertNoDbError(error);

  const row = data as ProfileRow | null;
  if (row === null || row === undefined) return null;

  return { ...row, role: mapRole(row.role) ?? 'user' };
}

/**
 * Birden çok profili tek sorguda okur.
 *
 * Geçmiş kayıtlarının "değiştiren kullanıcı" adını çözmek için kullanılır.
 *
 * ⚠ `staff_count_history` ile `profiles` arasında DOĞRUDAN foreign key yoktur
 *   (ikisi de `auth.users`'a bağlı iki ayrı tablo), bu yüzden PostgREST'in
 *   gömülü (embedded) join'i `PGRST200` döner. Ad çözümü iki adımda yapılır:
 *   önce kayıtlar, sonra bu fonksiyon.
 *
 * Bulunamayan kimlikler haritada YOKTUR; çağıran taraf bunu "adı bilinmiyor"
 * olarak ele alır.
 */
export async function findProfilesByIds(
  ids: readonly string[],
  client: SupabaseClient = getSupabaseClient(),
): Promise<Map<string, ProfileRow>> {
  const unique = [...new Set(ids)];

  if (unique.length === 0) return new Map();

  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, role, created_at')
    .in('id', unique);

  assertNoDbError(error);

  const map = new Map<string, ProfileRow>();
  for (const row of (data ?? []) as ProfileRow[]) {
    map.set(row.id, { ...row, role: mapRole(row.role) ?? 'user' });
  }

  return map;
}