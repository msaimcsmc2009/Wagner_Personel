import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { XIcon } from '../icons/UiIcons';

/**
 * Etkin filtre çipi — tables.md §3.
 *
 * "Filtreleri Temizle" düğmesi, herhangi bir filtre etkin olduğunda görünür.
 * O olmadan kullanıcı tablonun neden boş olduğunu anlayamaz; çipsiz boş bir
 * tablo, verinin SİLİNDİĞİ izlenimi verir.
 */
export interface FilterChipProps {
  label: string;
  /** Filtre adı ("Departman") ve değeri ("Üretim") ayrı verilir. */
  value: string;
  onRemove: () => void;
  className?: string;
}

export function FilterChip({ label, value, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-full border border-line-strong bg-surface pl-3 text-caption',
        'text-content-primary',
        className,
      )}
    >
      <span className="text-content-muted">{label}:</span>
      <span className="font-medium">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} ${value} filtresini kaldır`}
        className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full text-content-muted transition-colors duration-fast hover:bg-surface-sunken hover:text-content-primary"
      >
        <XIcon className="size-3.5" />
      </button>
    </span>
  );
}

/** Çip listesini saran ve "Temizle" eylemini barındıran satır. */
export function FilterChipRow({
  children,
  onClearAll,
  className,
}: {
  children?: ReactNode;
  onClearAll: () => void;
  className?: string;
}) {
  const hasChips = children !== undefined && children !== null && children !== false;

  if (!hasChips) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
      <button
        type="button"
        onClick={onClearAll}
        className="text-caption font-medium text-content-brand underline underline-offset-2 hover:text-content-primary"
      >
        Filtreleri Temizle
      </button>
    </div>
  );
}
