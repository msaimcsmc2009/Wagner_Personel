/**
 * Personel SAYISI sözleşmesi — FRONTEND tarafı.
 *
 * KAPSAM: bu uygulamada tek tek personel kaydı TUTULMAZ ve GÖSTERİLMEZ.
 * Ne `Personnel` tipi vardır, ne de bir personel listesi. Verilen veri yalnızca
 * iki grup için aggregate bir SAYIDIR: Üretim ve Endirekt.
 *
 * Backend'de aynı sözleşme `backend/src/types/staffCount.ts` içinde bulunur.
 * İki uygulama bağımsız derlendiği için tip bir monorepo paketi yerine iki
 * yerde yazılır; bu BİLİNÇLİ bir tekrardır ve `types/health.ts` dosyasındaki
 * notla aynı gerekçeye dayanır.
 *
 * ⚠ SÖZLEŞME KURALI — backend ile senkron:
 * `StaffCount` ve `StaffCountHistory` alan adları backend kopyasıyla BİREBİR
 * aynı olmalıdır. Ayrışırsa ekran bozuk görünür, hata mesajı çıkmaz.
 */

/**
 * Sayım yapılan gruplar — yalnız bu ikisi.
 *
 * Bunlar "departman" DEĞİLDİR. Birim kaydı tutulmaz; yalnızca bu iki grup
 * için kaç kişi olduğu saklanır. Sıra, dashboard'daki dağılım sırasını ve
 * form sırasını belirler.
 */
export const STAFF_CATEGORIES = ['Üretim', 'Endirekt'] as const;

export type StaffCategory = (typeof STAFF_CATEGORIES)[number];

/** Kategorinin geçerli olup olmadığını kontrol eder. */
export function isStaffCategory(value: unknown): value is StaffCategory {
  return typeof value === 'string' && (STAFF_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Üst sınır — backend ile AYNI değer. Form doğrulaması bu değeri kullanır;
 * ayrışırsa kullanıcı geçerli sayılı bir değer yazıp 422 alır.
 */
export const MAX_HEADCOUNT = 100_000;

/** Bir kategorinin güncel sayısı. */
export interface StaffCount {
  category: StaffCategory;
  headcount: number;
  /** ISO 8601; "son güncelleme" bilgisi. */
  updatedAt: string;
}

/**
 * Geçmiş kayıt.
 *
 * Bu kayıtlar SİLİNMEZ; her değişiklik yeni bir tane oluşturur. Böylece
 * "geçen ay üretimde kaç kişiydi?" sorusu yanıtlanabilir.
 */
export interface StaffCountHistory {
  id: number;
  category: StaffCategory;
  headcount: number;
  /** ISO 8601. */
  recordedAt: string;
}

/**
 * Güncel sayılar ve toplam.
 *
 * ⚠ `total` istemciden GELMEZ ve HESAPLANIR (Üretim + Endirekt). Formda
 * toplam alanı YOKTUR ve kullanıcıdan istenmez; bir toplamın elle girilmesi
 * gereksizdir çünkü iki sayıdan türetilebilir ve elle girilen bir toplam
 * bu iki sayıyla çelişebilir.
 */
export interface StaffCountsResponse {
  categories: StaffCount[];
  total: number;
}

/** Geçmiş listesi yanıtı. */
export interface StaffCountHistoryResponse {
  data: StaffCountHistory[];
}

/** Tek bir güncellemenin sonucu. */
export interface UpdateStaffCountResponse {
  category: StaffCategory;
  headcount: number;
  updatedAt: string;
  /** Güncelleme sonrası Üretim + Endirekt. */
  total: number;
}
