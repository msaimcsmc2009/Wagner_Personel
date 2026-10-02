import { getSupabaseClient } from '../config/supabase.js';
import { findProfilesByIds } from '../repositories/profile.repository.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';

export type StaffCategory = 'Üretim' | 'Endirekt';

export interface StaffCountRow {
  category: StaffCategory;
  headcount: number;
  updatedAt: string;
}

export interface StaffCountHistoryRow {
  id: number;
  category: StaffCategory;
  headcount: number;
  recordedAt: string;
  recordedBy: string | null;
  recordedByName: string | null;
}

export interface StaffCountsState {
  categories: StaffCountRow[];
  total: number;
}

/**
 * `staff_count_history` satır biçimi (snake_case).
 *
 * Tipli olarak tanımlanır: tabloya erişim `service_role` anahtarıyla
 * yapıldığı için PostgREST şema tipleri üretilmiş `Database` tipi yok;
 * sorgunun döndürdüğü sütunlar burada sabitlenir.
 */
interface HistoryRow {
  id: number;
  category: string;
  headcount: number;
  recorded_at: string;
  recorded_by: string | null;
}

function toIsoString(value: unknown): string {
  if (typeof value === 'string' && value.length > 0) return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

function toNumber(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return Math.trunc(n);
  return 0;
}

export async function getCurrentStaffCounts(): Promise<StaffCountsState> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('staff_counts')
    .select('category, headcount, updated_at')
    .in('category', ['Üretim', 'Endirekt']);

  if (error !== null) {
    logger.error('staff_counts select failed', { err: error.message });
    throw new AppError(500, 'DATABASE_ERROR', 'Veritabanı hatası');
  }

  const categories: StaffCountRow[] = (data ?? []).map((row) => ({
    category: row.category as StaffCategory,
    headcount: toNumber(row.headcount),
    updatedAt: toIsoString(row.updated_at),
  }));

  // Eksik kategori varsa frontend'in beklediği iki kategoriyi yine oluştur.
  for (const category of ['Üretim', 'Endirekt'] as StaffCategory[]) {
    if (!categories.some((item) => item.category === category)) {
      categories.push({
        category,
        headcount: 0,
        updatedAt: new Date(0).toISOString(),
      });
    }
  }

  // Dashboard sırasını sabit tut.
  categories.sort(
    (a, b) =>
      (a.category === 'Üretim' ? 0 : 1) -
      (b.category === 'Üretim' ? 0 : 1),
  );

  const total = categories.reduce(
    (sum, item) => sum + item.headcount,
    0,
  );

  return {
    categories,
    total,
  };
}

export async function patchStaffCountCategory(
  category: StaffCategory,
  headcount: number,
  userId: string
): Promise<StaffCountRow> {
  if (!Number.isFinite(headcount) || headcount < 0 || headcount > 100000) {
    throw new AppError(422, 'INVALID_HEADCOUNT', 'Geçersiz personel sayısı.');
  }

  const supabaseAdmin = getSupabaseClient();

  /*
   * Yazma TEK transaction içinde, veritabanı fonksiyonuyla yapılır.
   *
   * `p_actor` AÇIKÇA geçirilir: `auth.uid()`, backend `service_role`
   * anahtarıyla çağrıldığında `NULL` döndüğü için yetkiyi odak
   * değişkeninden okumak MÜMKÜN DEĞİLDİR. Fonksiyon yetkiyi `p_actor`
   * üzerinden `profiles.role`'den doğrular; `requireAdmin` aynı kontrolü
   * istek başında yapar.
   */
  const { error } = await supabaseAdmin.rpc('record_staff_count', {
    p_category: category,
    p_headcount: headcount,
    p_actor: userId,
  });

  if (error !== null) {
    logger.warn('rpc record_staff_count failed', {
      code: error.code,
      err: error.message,
      category,
    });

    // 42501: profil yok ya da admin değil. Kullanıcıya teknik hata değil,
    // yetki metni gösterilir.
    if (error.code === '42501') {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Bu işlemi gerçekleştirmek için yönetici yetkisi gerekiyor.',
      );
    }

    // 22023 / 23514: kategori ya da sayı geçersiz. Aynı anlama gelir.
    if (error.code === '22023' || error.code === '23514') {
      throw new AppError(422, 'CONSTRAINT_VIOLATION', 'Girilen bilgiler geçersiz. Kategoriyi ve personel sayısını kontrol edin.');
    }

    // 42883: migration uygulanmamış. Bu bir yapılandırma hatasıdır, kullanıcının
    // hatası değildir.
    if (error.code === '42883') {
      logger.error('record_staff_count fonksiyonu bulunamadı', {
        code: error.code,
        migration: '0005_roles_grants_and_write.sql',
      });
      throw new AppError(
        503,
        'MIGRATION_NOT_APPLIED',
        'Veritabanı şeması güncel değil. Migration uygulanmadan kayıt yapılamaz.',
      );
    }

    throw new AppError(500, 'DATABASE_ERROR', 'Kayıt güncellenemedi. Lütfen tekrar deneyin.');
  }

  logger.info('staff_count updated', { category, headcount, userId });

  const updated = await getSupabaseClient()
    .from('staff_counts')
    .select('category, headcount, updated_at')
    .eq('category', category)
    .single();

  if (updated.error !== null) {
    /*
     * Yazma başarılı olduktan sonra TEKRAR OKUMA başarısız olursa kayıt yine de
     * yazılmıştır. Bu durumda istemciye 500 dönmek "kaydedilmedi" yanılgısı
     * yaratır ve kullanıcı aynı değeri tekrar gönderir — bu da ikinci bir
     * geçmiş kaydı doğurur. Bunun yerine yazılan değer döner.
     */
    logger.error('güncel değer okunamadı; yazılan değer döner', {
      code: updated.error.code,
      category,
    });

    return {
      category,
      headcount: Math.trunc(headcount),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    category: updated.data.category as StaffCategory,
    headcount: toNumber(updated.data.headcount),
    updatedAt: toIsoString(updated.data.updated_at),
  };
}

export async function getStaffCountHistory(params: {
  category?: StaffCategory;
  limit?: number;
}): Promise<StaffCountHistoryRow[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('staff_count_history')
    .select(`
      id,
      category,
      headcount,
      recorded_at,
      recorded_by
    `)
    .order('recorded_at', { ascending: false });

  if (params.category !== undefined) {
    query = query.eq('category', params.category);
  }

  const limit = params.limit ?? 100;
  query = query.limit(Math.max(1, Math.min(limit, 500)));

  const { data, error } = await query;

  if (error !== null) {
    logger.error('staff_count_history select failed', { err: error.message });
    throw new AppError(500, 'DATABASE_ERROR', 'Geçmiş kayıtlar yüklenemedi. Lütfen tekrar deneyin.');
  }

  const rows = (data ?? []) as HistoryRow[];
  const profiles = await findProfilesByIds(
    rows.map((row) => row.recorded_by).filter((id): id is string => typeof id === 'string'),
  );

  return rows.map((row) => ({
    id: toNumber(row.id),
    category: row.category as StaffCategory,
    headcount: toNumber(row.headcount),
    recordedAt: toIsoString(row.recorded_at),
    recordedBy: row.recorded_by ?? null,
    // Profil silinmiş veya migration çalışmamışsa adı bilinmez. Bu bir hata
    // değil, verinin kendisinin durumu: geçmiş kaydı yine de gösterilir.
    recordedByName:
      row.recorded_by === null ? null : (profiles.get(row.recorded_by)?.full_name ?? null),
  }));
}
