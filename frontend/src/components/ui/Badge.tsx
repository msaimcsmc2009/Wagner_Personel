import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Durum rozeti — components.md §Badge.
 *
 * İKİ tedavi, İKİSİ DE yalnızca ikisi: `soft` (tabloda varsayılan) ve
 * `solid` (yüksek vurgu, sayaç). Başka bir varyant eklenmez.
 *
 * **Durum hiçbir zaman renkten ibaret değildir.** Bu bileşen yalnızca kutu ve
 * metin rengini boyar; durum KELİMESİNİ çağıran bileşen verir
 * ("Aktif", "İzinli", "Onay bekliyor"). Renk tek başına sinyal olamaz.
 *
 * Semantik eşleme: Aktif→success · Beklemede→warning · Pasif→danger ·
 * Onay bekliyor→info · İzinli→neutral.
 */
export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeTreatment = 'soft' | 'solid';

const SOFT_CLASS: Record<BadgeTone, string> = {
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
  info: 'bg-info-soft text-info-text',
  neutral: 'bg-surface-sunken text-content-secondary',
};

const SOLID_CLASS: Record<BadgeTone, string> = {
  success: 'bg-success text-content-inverse',
  warning: 'bg-warning text-content-inverse',
  danger: 'bg-danger text-content-inverse',
  info: 'bg-info text-content-inverse',
  neutral: 'bg-content-secondary text-content-inverse',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  treatment?: BadgeTreatment;
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({
  tone = 'neutral',
  treatment = 'soft',
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-caption font-medium whitespace-nowrap',
        treatment === 'soft' ? SOFT_CLASS[tone] : SOLID_CLASS[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
