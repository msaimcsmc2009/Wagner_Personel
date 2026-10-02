import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Kart — layout.md §7.
 *
 * Sınırlı, kendi içinde anlamlı, başlığı olan bir içerik grubu için
 * kullanılır. Bir sayfa bölümünü, tek bir form alanını veya bir tabloyu
 * karta koymak reddedilir — "her şeyi kutuya koyma" refleksi, jenerik AI
 * dashboard görünümünün birincil nedenidir.
 *
 * Dinlenen hâlde GÖLGE YOKTUR; yalnızca 1px kenarlık vardır. Gölge yalnızca
 * tamamı tıklanabilir bir kartın hover'ında anlam taşır ve o durum
 * `interactive` ile açılır.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Tamamı tıklanabilirse hover gölgesi verir. */
  interactive?: boolean;
  /** Kart içeriğinin dolgusu. `flush` tablo gibi kenarlıksız gövde ister. */
  padding?: 'none' | 'sm' | 'md';
}

const PADDING_CLASS = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
} as const;

export function Card({
  interactive = false,
  padding = 'md',
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface',
        interactive &&
          'transition-shadow duration-fast hover:shadow-subtle focus-within:shadow-subtle',
        PADDING_CLASS[padding],
        className,
      )}
      {...rest}
    />
  );
}

export interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Kart başlığı. components.md: "Başlık ve gövde ASLA ikisi birden kenarlıklı
 * olmaz. Kartın tek kenarı vardır." Başlık kenar çizgisi kullanmaz.
 */
export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-h3 text-content-primary">{title}</h2>
        {description !== undefined && (
          <p className="text-body-sm text-content-muted">{description}</p>
        )}
      </div>
      {action !== undefined && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
