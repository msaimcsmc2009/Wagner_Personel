import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Breadcrumb, type Crumb } from '../ui/Breadcrumb';

/**
 * Sayfa başlığı — layout.md §4.
 *
 * KART DEĞİLDİR ve zemin dolgusu YOKTUR: tuvalin (`#F8FAFC`) doğrudan
 * üzerinde durur. Başlığa kenarlık veya arka plan eklemek, hiyerarşiyi
 * çerçeveleyerek zayıflatır.
 *
 * Aksiyonlar aynı tabanda sağa hizalıdır ve `primary` EN SAĞDA durur.
 * Mobilde başlık tam genişlik alır; aksiyonlar altta, birincil buton tam
 * genişlikte.
 */
export interface PageHeaderProps {
  /** Sayfa başlığı. */
  title: string;
  /** Vurgulanacak kelime; marka renginde tek vurgu. */
  accent?: string;
  /** Başlığın altındaki meta satırı: sayaç, filtre özeti, son yenileme. */
  meta?: string;
  crumbs?: Crumb[];
  /** Aksiyonlar; `primary` en sonda. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  accent,
  meta,
  crumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {crumbs !== undefined && crumbs.length > 0 && <Breadcrumb items={crumbs} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          {/* typography.md §4: sayfada TEK h1, marka vurgusu tek kelimede. */}
          <h1 className="text-h1 text-content-primary">
            {title}
            {accent !== undefined && (
              <>
                {' '}
                <span className="text-content-brand">{accent}</span>
              </>
            )}
          </h1>

          {meta !== undefined && <p className="text-body text-content-muted">{meta}</p>}
        </div>

        {actions !== undefined && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">{actions}</div>
        )}
      </div>
    </div>
  );
}
