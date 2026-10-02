import { apiClient, ApiError } from './apiClient';
import type {
  StaffCategory,
  StaffCountHistoryResponse,
  StaffCountsResponse,
  UpdateStaffCountResponse,
} from '../types/staffCount';

/**
 * Personel sayısı servisi — API'ye giden tek kapı.
 *
 * Bu servis MOCK VERİ DÖNDÜRMEZ. Sayılar veritabanından okunur; veritabanı
 * yapılandırılmamışsa hata `ApiError` olarak yükselir ve ekran hata durumunu
 * gösterir. Sahte bir sayı göstermek, kullanıcıya "bu doğru" dedirtir ve
 * gerçek veri geldiğinde ekranın değişmesi şaşırtıcı olur.
 *
 * Hatalar burada YUTULMAZ. Çağıran taraf her zaman `try/catch` içinde ele
 * almak zorundadır; sessizce boş veri dönen bir servis, ekranda "kayıt yok"
 * gibi görünür ve gerçek hata kaybolur.
 */

const COUNTS_PATH = '/staff-counts';
const HISTORY_PATH = '/staff-counts/history';

/**
 * Güncel sayılar ve hesaplanan toplam.
 *
 * `total` backend'de `SUM` ile hesaplanır; frontend toplamı kendisi
 * hesaplamaz. Böylece tek bir hesaplama kaynağı vardır ve iki tarafın
 * toplamı ayrışamaz.
 */
export async function fetchStaffCounts(signal?: AbortSignal): Promise<StaffCountsResponse> {
  return apiClient.get<StaffCountsResponse>(COUNTS_PATH, signal);
}

/**
 * Geçmiş kayıtlar — en yeniden başa.
 *
 * @param category  Yalnız bu kategorinin geçmişi. Verilmezse tümü.
 * @param limit     Backend varsayılanı 50, üst sınır 200.
 */
export async function fetchStaffCountHistory(
  options: { category?: StaffCategory | undefined; limit?: number | undefined } = {},
  signal?: AbortSignal,
): Promise<StaffCountHistoryResponse> {
  const params = new URLSearchParams();

  if (options.category !== undefined) {
    params.set('category', options.category);
  }

  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }

  const query = params.toString();
  const path = query === '' ? HISTORY_PATH : `${HISTORY_PATH}?${query}`;

  return apiClient.get<StaffCountHistoryResponse>(path, signal);
}

/**
 * Bir kategorinin personel sayısını günceller.
 *
 * Önceki değer SİLİNMEZ; backend her değişikliği geçmişe yeni bir kayıt olarak
 * ekler. Yanıt, güncel değeri ve yeni toplamı döner.
 *
 * `headcount` metin olarak da gönderilebilir; backend sayısal içeriği
 * doğrular ve tam sayıya çevirir.
 */
export async function updateStaffCount(
  category: StaffCategory,
  headcount: number | string,
): Promise<UpdateStaffCountResponse> {
  return apiClient.patch<UpdateStaffCountResponse>(COUNTS_PATH, { category, headcount });
}

/**
 * Bileşen seviyesinde hata ayrımı.
 *
 * Uygulamanın en olası hatası "veritabanı yapılandırılmamış" durumudur
 * (`SUPABASE_NOT_CONFIGURED` / `MIGRATION_NOT_APPLIED`). Bu durumda
 * kullanıcıya nötr bir "bağlantı yok" mesajı göstermek, ham hata kodunu
 * göstermekten daha doğrudur.
 */
export function isDataSourceUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === 'SUPABASE_NOT_CONFIGURED' || error.code === 'MIGRATION_NOT_APPLIED')
  );
}
