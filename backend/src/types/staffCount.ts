/**
 * Personel SAYISI sözleşmesi — BACKEND tarafı.
 *
 * KAPSAM: bu uygulamada tek tek personel kaydı TUTULMAZ. Ne kişi ne de
 * departman/izin/eğitim kaydı vardır. Verilen veri yalnızca iki grup için
 * aggregate bir SAYIDIR: Üretim ve Endirekt.
 *
 * Frontend'de aynı sözleşme `frontend/src/types/staffCount.ts` içinde
 * bulunur. İki uygulama bağımsız derlendiği için tip bir monorepo paketi
 * yerine iki yerde yazılır; bu BİLİNÇLİ bir tekrardır ve `health.ts`
 * dosyasındaki notla aynı gerekçeye dayanır.
 *
 * ⚠ SÖZLEŞME KURALI — frontend ile senkron:
 * `StaffCount` ve `StaffCountHistory` alan adları `frontend/src/types/
 * staffCount.ts` ile BİREBİR aynı olmalıdır. Ayrışırsa derleyici sessiz
 * `undefined` yerine hata vermezse bile ekran bozuk görünür.
 */

/* -------------------------------------------------------------------------
   Kategoriler
   -------------------------------------------------------------------------
   Aşağıdaki dizi veritabanı CHECK kısıtıyla ÇİFTE kaynaktır: SQL'de
   `staff_counts_category_check` tanımlıyor, burada tanımlıyoruz. İkisi
   ayrışırsa verilemeyen bir kategori sessizce reddedilir. Birlikte
   güncellenmelidir.
   ------------------------------------------------------------------------- */

/**
 * Sayım yapılan gruplar.
 *
 * Bunlar "departman" DEĞİLDİR. Birim kaydı tutulmaz; yalnızca bu iki grup
 * için kaç kişi olduğu saklanır. İsimler arayüzde birebir görünür ve
 * Türkçedir, bu yüzden veritabanında `enum` yerine `text` + `CHECK` kullanılır
 * (enum'da Türkçe değerler her yerde tırnak içinde yazılmalıdır ve PostgREST
 * süzgeçleri enum adlarıyla uyuşmaz).
 *
 * Sıra, dashboard'daki dağılım sırasını ve menü sırasını belirler.
 */
export const STAFF_CATEGORIES = ['Üretim', 'Endirekt'] as const;

export type StaffCategory = (typeof STAFF_CATEGORIES)[number];

/** Kategorinin geçerli olup olmadığını kontrol eder. */
export function isStaffCategory(value: unknown): value is StaffCategory {
  return typeof value === 'string' && (STAFF_CATEGORIES as readonly string[]).includes(value);
}

/** Başlangıçta her kategori 0'dan başlar; gerçek sayılar kullanıcı girer. */
export const DEFAULT_HEADCOUNT = 0;

/**
 * Üst sınır. Sayacın taşmasını ve istemci hatalarını yakalamak için konur;
 * veritabanındaki CHECK kısıtıyla Aynı değer kullanılmalıdır.
 */
export const MAX_HEADCOUNT = 100_000;

/* -------------------------------------------------------------------------
   Satır tipleri (veritabanı)
   ------------------------------------------------------------------------- */

/** `staff_counts` tablosu satırı. */
export interface StaffCountRow {
  category: StaffCategory;
  headcount: number;
  /** ISO 8601. */
  updated_at: string;
}

/** `staff_count_history` tablosu satırı. */
export interface StaffCountHistoryRow {
  /** BIGINT; JSON sayı olarak döner ama istemci tarafında string'e dönüşebilir. */
  id: number;
  category: StaffCategory;
  headcount: number;
  /** ISO 8601. */
  recorded_at: string;
  /** `YYYY-MM-01` — ay bazlı sorgular için. */
  recorded_month: string;
}

/* -------------------------------------------------------------------------
   API sözleşmesi
   ------------------------------------------------------------------------- */

/**
 * Bir kategorinin güncel sayısı.
 *
 * `frontend/src/types/staffCount.ts` → `StaffCount` ile birebir aynı olmalıdır.
 */
export interface StaffCount {
  category: StaffCategory;
  headcount: number;
  /** ISO 8601; "son güncelleme" bilgisi. */
  updatedAt: string;
}

/**
 * Geçmiş kayıt.
 *
 * `frontend/src/types/staffCount.ts` → `StaffCountHistory` ile aynı olmalıdır.
 * Bu kayıtlar SİLİNMEZ; her değişiklik yeni bir tane oluşturur.
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
 * ⚠ `total` İSTEĞE BAĞLI DEĞİLDİR ve istemciden GELMEZ. Yani
 * "kullanıcı toplamı girmiyecektir" kuralı veritabanı seviyesinde
 * uygulanmıştır: toplam `SUM(headcount)` ile hesaplanır. Saklanan bir
 * toplam, satırlardan biri güncellendiğinde kendiliğinden eskir.
 */
export interface StaffCountsResponse {
  categories: StaffCount[];
  /** Üretim + Endirekt. */
  total: number;
}

/** Geçmiş listesi yanıtı. */
export interface StaffCountHistoryResponse {
  data: StaffCountHistory[];
}

/** Sayı güncelleme isteğinin gövdesi. */
export interface UpdateStaffCountRequest {
  category: StaffCategory;
  headcount: number;
}

/** Tek bir güncellemenin sonucu (yeni toplamla birlikte). */
export interface UpdateStaffCountResponse {
  category: StaffCategory;
  headcount: number;
  updatedAt: string;
  /** Güncelleme sonrası Üretim + Endirekt. */
  total: number;
}

/* -------------------------------------------------------------------------
   Geçmiş sorgusu
   ------------------------------------------------------------------------- */

/**
 * Geçmiş sorgu parametreleri.
 *
 * @param category  Yalnız bu kategorinin geçmişi. Verilmezse tüm kategoriler.
 * @param limit     En fazla kaç kayıt. Üst sınır 200 (bir ekrana sığan miktar).
 */
export interface StaffCountHistoryQuery {
  category?: StaffCategory | undefined;
  limit?: number | undefined;
}

export const DEFAULT_HISTORY_LIMIT = 50;
export const MAX_HISTORY_LIMIT = 200;
