import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { XIcon } from '../icons/UiIcons';
import { IconButton } from './IconButton';

/**
 * Katman bileşenlerinin ortak davranışı — layout.md §10, components.md §Modal.
 *
 * Her overlay için zorunlu olan dört şey burada bir kez uygulanır:
 *  1. Açılışta odak diyaloğa (ilk alana) taşınır ve **kilitlenir**
 *  2. `Esc` kapatır
 *  3. Kapanışta odak TETİKLEYİCİYE döner
 *  4. Arka plan kaydırması kilitlenir, kapanışta eski değer geri yazılır
 *
 * `role="dialog"` + `aria-modal="true"` + `aria-labelledby` başlığa bağlanır.
 * **Bir modal sayfa değildir.** Sekmesi, kenar çubuğu ve kaydırma çubuğu
 * gereken bir iş modalde değil, kendi sayfasında yapılır.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface OverlayFrameProps {
  open: boolean;
  onClose: () => void;
  /** Başlığın `id`'si. `aria-labelledby` buna bağlanır. */
  labelledBy: string;
  children: ReactNode;
  variant: 'center' | 'right';
  /** `center` varyantı için genişlik sınıfı. */
  widthClass?: string;
  className?: string;
}

export function OverlayFrame({
  open,
  onClose,
  labelledBy,
  children,
  variant,
  widthClass,
  className,
}: OverlayFrameProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Açılışta ilk alana, kapanışta tetikleyiciye odak.
  //
  // `wasOpen` takibi şarttır: StrictMode geliştirme ortamında efektleri iki kez
  // çalıştırır. Geçiş kontrolü olmadan ikinci çalıştırmada `document.activeElement`
  // artık panelin KENDİSİ (kapatma düğmesi) olur ve `triggerRef` bir diyalog
  // içi düğmeyle ezilir. Kapanışta odak DOM'dan silinmiş bir düğmeye
  // taşınmaya çalışır ve odak gövdeye düşer — yani "odak tetikleyiciye döner"
  // kuralı sessizce bozulur.
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      if (!wasOpenRef.current) {
        const active = document.activeElement;
        triggerRef.current = active instanceof HTMLElement ? active : null;
        wasOpenRef.current = true;
      }

      const first = getFocusable(panelRef.current)[0];
      (first ?? panelRef.current)?.focus();
      return;
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;

      const trigger = triggerRef.current;
      triggerRef.current = null;

      if (trigger !== null && document.contains(trigger)) {
        trigger.focus();
      }
    }
  }, [open]);

  // Arka plan kaydırma kilidi; önceki değer geri yazılır.
  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // `Esc` + odak döngüsü.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = getFocusable(panelRef.current);
      const first = items[0];
      const last = items[items.length - 1];
      if (first === undefined || last === undefined) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  const layer = (
    <div
      className={cn(
        'fixed inset-0 z-modal flex bg-overlay',
        variant === 'center' ? 'items-center justify-center p-4' : 'justify-end',
      )}
    >
      {/*
        Perde. Tıklamayı kapatır. Klavyeyi ilgilendiren yol `Esc`'tir; perde
        ekran okuyucuya da bir şey söylemez.
      */}
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-dvh flex-col overflow-hidden bg-surface shadow-elevated',
          variant === 'center' ? cn('w-full rounded-xl', widthClass ?? 'max-w-120') : 'h-full w-full max-w-140 rounded-l-xl',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(layer, document.body);
}

function getFocusable(panel: HTMLDivElement | null): HTMLElement[] {
  if (panel === null) return [];
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** `confirm` 400 · `form` 480 · `medium` 640. */
  width?: 'confirm' | 'form' | 'medium';
  children: ReactNode;
  /** Altbilgi: `danger` solda, `primary` sağda. */
  footer?: ReactNode;
  showClose?: boolean;
}

const MODAL_WIDTH: Record<NonNullable<ModalProps['width']>, string> = {
  confirm: 'max-w-100',
  form: 'max-w-120',
  medium: 'max-w-160',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  width = 'form',
  children,
  footer,
  showClose = true,
}: ModalProps) {
  const id = useId();
  const titleId = `modal-title-${id}`;

  return (
    <OverlayFrame
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      variant="center"
      widthClass={MODAL_WIDTH[width]}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line p-5">
        <div className="flex min-w-0 flex-col gap-1">
          {/* Modal başlığı `h3` asla `h1` değildir. */}
          <h3 id={titleId} className="text-h3 font-semibold text-content-primary">
            {title}
          </h3>
          {description !== undefined && (
            <p className="text-body-sm text-content-muted">{description}</p>
          )}
        </div>
        {showClose && (
          <IconButton label="Kapat" icon={<XIcon className="size-5" />} onClick={onClose} size="sm" />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>

      {footer !== undefined && (
        <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-4">
          {footer}
        </div>
      )}
    </OverlayFrame>
  );
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Sağdan çekmece — bir kaydın detayı veya bağlamı gerektiren uzun form için.
 * Liste görünür kalır; bu yüzden "modal" değil, "drawer" seçilir.
 */
export function Drawer({ open, onClose, title, description, children, footer }: DrawerProps) {
  const id = useId();
  const titleId = `drawer-title-${id}`;

  return (
    <OverlayFrame open={open} onClose={onClose} labelledBy={titleId} variant="right">
      <div className="flex items-start justify-between gap-4 border-b border-line p-5">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 id={titleId} className="text-h3 font-semibold text-content-primary">
            {title}
          </h3>
          {description !== undefined && (
            <p className="text-body-sm text-content-muted">{description}</p>
          )}
        </div>
        <IconButton label="Kapat" icon={<XIcon className="size-5" />} onClick={onClose} size="sm" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>

      {footer !== undefined && (
        <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-4">
          {footer}
        </div>
      )}
    </OverlayFrame>
  );
}
