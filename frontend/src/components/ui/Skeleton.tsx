import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * İskelet — components.md §Skeleton.
 *
 * İskelet GERÇEK İÇERİĞİN GEOMETRİSİNİ yansıtır: aynı satır yüksekliği, aynı
 * sütun genişlikleri, aynı öğe sayısı. Yüklenen düzenle uyuşmayan bir iskelet
 * görünür bir sıçramaya yol açar ve bu, iskeletin yokluğundan kötüdür.
 *
 * **300ms'den kısa süre için iskelet GÖSTERİLMEZ** — flash olur ve arıza gibi
 * okunur. Gecikmeyi çağıran yönetir.
 *
 * Satır yüksekliği `h-12` (48px) ile hücreye verilir; padding değil, tam
 * yükseklik. Böylece gerçek satır ile iskelet satırı bit bit aynıdır.
 */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('block rounded-sm bg-surface-sunken', className)} />;
}

/** Bölge düzeyinde yükleme duyurusu. `aria-busy` + ölçülebilir metin. */
export function SkeletonRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/**
 * Tablo iskeleti — 8–10 satır (asla 3 değil), başlık satırı görünür kalır,
 * tablo yüksekliği kararlıdır.
 */
export function SkeletonRows({
  rows,
  columns,
}: {
  rows: number;
  /** Her sütun için iskelet çubuğu genişlik sınıfı. */
  columns: string[];
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex}>
          {columns.map((columnClass, columnIndex) => (
            <td key={columnIndex} className="h-12 px-4 align-middle">
              <Skeleton className={cn('h-4', columnClass)} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
