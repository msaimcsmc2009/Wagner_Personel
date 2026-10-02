import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckIcon,
  InfoIcon,
  XIcon,
} from '../icons/UiIcons';

/**
 * Satır içi uyarı — components.md §Alert / Banner.
 *
 * Toast'tan farklıdır: kalıcıdır, akışın içindedir, kendiliğinden kaybolmaz.
 *
 * `danger` ve `warning` asla otomatik kapanmaz — kaçırılan bir hata olmuş
 * hatadır (layout.md §11).
 */
export type AlertTone = 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASS: Record<AlertTone, { wrap: string; icon: ReactNode }> = {
  success: {
    wrap: 'bg-success-soft text-success-text border-l-success',
    icon: <CheckIcon className="size-5 shrink-0" />,
  },
  warning: {
    wrap: 'bg-warning-soft text-warning-text border-l-warning',
    icon: <AlertTriangleIcon className="size-5 shrink-0" />,
  },
  danger: {
    wrap: 'bg-danger-soft text-danger-text border-l-danger',
    icon: <AlertCircleIcon className="size-5 shrink-0" />,
  },
  info: {
    wrap: 'bg-info-soft text-info-text border-l-info',
    icon: <InfoIcon className="size-5 shrink-0" />,
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  /** Kapatma düğmesi. `danger`/`warning` için kullanılmaz. */
  onDismiss?: () => void;
  action?: ReactNode;
  className?: string;
}

export function Alert({
  tone = 'info',
  title,
  children,
  onDismiss,
  action,
  className,
}: AlertProps) {
  const { wrap, icon } = TONE_CLASS[tone];

  // `danger` ve `warning` uyarıları `role="alert"` (kapatıcı olmayan),
  // `success`/`info` `role="status"`. Bileşen asla `aria-live="assertive"`
  // kullanmaz.
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';

  return (
    <div role={role} className={cn('flex gap-3 rounded-lg border-l-3 p-4', wrap, className)}>
      <span aria-hidden="true">{icon}</span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title !== undefined && <h4 className="text-h4 font-semibold">{title}</h4>}
        <div className="text-body">{children}</div>
        {action !== undefined && <div className="mt-1 flex gap-2">{action}</div>}
      </div>

      {onDismiss !== undefined && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Uyarıyı kapat"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-fast hover:bg-surface/60"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
