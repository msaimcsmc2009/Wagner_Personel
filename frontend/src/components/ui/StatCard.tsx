import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * KPI kartı — layout.md §9.
 *
 * Sıra: etiket (`text-body-sm`, `text-muted`) → değer (`h1`, `tabular-nums`)
 * → değişim (`text-caption`).
 *
 * Etiket kaynakta zaten büyük harfle yazılır; CSS `uppercase` kullanılmaz
 * (Türkçe `i → I` sorunu).
 *
 * Değişim **renk ve glif ile birlikte** gösterilir (`▲` / `▼`). Renk tek
 * başına sinyal olamaz — renk körlüğü olan bir kullanıcı yönü göremez.
 */
export interface StatCardProps {
  label: string;
  value: string;
  /** `+12` / `−2` gibi işaretli değişim metni. */
  delta?: string;
  /** Değişim yönü. `flat` nötr. */
  direction?: 'up' | 'down' | 'flat';
  /** Değişimin açıklaması, örn. "geçen aya göre". */
  deltaHint?: string;
  icon?: ReactNode;
  className?: string;
}

const DIRECTION_GLYPH = {
  up: '▲',
  down: '▼',
  flat: '—',
} as const;

const DIRECTION_COLOR = {
  up: 'text-success-text',
  down: 'text-danger-text',
  flat: 'text-content-muted',
} as const;

export function StatCard({
  label,
  value,
  delta,
  direction = 'flat',
  deltaHint,
  icon,
  className,
}: StatCardProps) {
  return (
    <div className={cn('flex flex-col gap-2 rounded-xl border border-line bg-surface p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-label text-content-muted">{label}</p>
        {icon !== undefined && <span aria-hidden="true" className="text-content-muted">{icon}</span>}
      </div>

      <p className="text-h1 font-semibold text-content-primary tabular-nums">{value}</p>

      {delta !== undefined && (
        <p className={cn('flex items-center gap-1.5 text-caption', DIRECTION_COLOR[direction])}>
          <span aria-hidden="true">{DIRECTION_GLYPH[direction]}</span>
          <span className="font-medium tabular-nums">{delta}</span>
          {deltaHint !== undefined && <span className="text-content-muted">{deltaHint}</span>}
        </p>
      )}
    </div>
  );
}
