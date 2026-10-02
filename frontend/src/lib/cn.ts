/**
 * Sınıf adı birleştirici.
 *
 * `clsx` veya `tailwind-merge` eklemek yerine bu kadarı yeterlidir ve
 * bağımlılık sayısı değişmez. Yalnızca `false | null | undefined` ve boş
 * string değerleri düşürür — koşullu sınıfları `cn(a, b && 'c')` ile yaz.
 *
 * Çakışma çözümü YAPMAZ: verilen sınıflar CSS kaynağına göre sırayla
 * uygulanır. Bileşenler bu yüzden `className`'i en SONA ekler ve çağıranın
 * yalnızca yerleşim (layout) sınıfları geçmesini bekler; bir bileşenin taban
 * rengini ezmek gerekiyorsa varyant kullan, `className` ile değil.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  let out = '';
  for (const value of values) {
    if (value === false || value === null || value === undefined || value === '') {
      continue;
    }
    out = out === '' ? value : `${out} ${value}`;
  }
  return out;
}
