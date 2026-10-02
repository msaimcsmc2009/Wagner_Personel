/**
 * Türkçe biçimlendirme yardımcıları — AGENTS.md kural 10.
 *
 * Tarih `12.04.2019`, sayı `1.234` / `12,50`. Elle yazılan biçimlendirme
 * kültürden bağımsız yanlış olur; bu yüzden `Intl` kullanılır ve tarayıcının
 * `Intl` desteği yeterlidir — ayrı bir tarih/sayı paketi gerekmez.
 */
const LOCALE = 'tr-TR';

const DATE_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Yalnız saat — `09:24`.
 *
 * responsive.md §7'nin dar ekran kuralı gereği geçmiş tablosu tarihi iki
 * parçaya böler: dar ekranda gün/ay/yıl, geniş ekranda gün/ay/yıl + saat.
 * Saat ayrı bir biçimlendirici olmadan, tarih dizesinden `substring` ile
 * kesilirse bileşim (`slice`) kültürden bağımsız yanlış olur.
 */
const TIME_FORMAT = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
});

const NUMBER_FORMAT = new Intl.NumberFormat(LOCALE);
const DECIMAL_FORMAT = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2 });

/** ISO dizesini `12.04.2019` biçimine çevirir. */
export function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(isoDate));
}

export function formatDateTime(isoDateTime: string): string {
  return DATE_TIME_FORMAT.format(new Date(isoDateTime));
}

/** ISO dizesini `09:24` biçimine çevirir. */
export function formatTime(isoDateTime: string): string {
  return TIME_FORMAT.format(new Date(isoDateTime));
}

/** 248 → "248", 2480 → "2.480" */
export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

export function formatDecimal(value: number): string {
  return DECIMAL_FORMAT.format(value);
}

/**
 * Aralık etiketi: "1–25 / 248 kayıt" (tables.md §4).
 * Toplam her zaman gösterilir.
 */
export function formatRange(from: number, to: number, total: number): string {
  return `${from}–${to} / ${NUMBER_FORMAT.format(total)} kayıt`;
}

/** Uzun metni arama sonucunda kısaltır. */
export function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}…`;
}
