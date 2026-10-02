import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * Tooltip — components.md §Tooltip.
 *
 * Hover VE FOCUS ile açılır (klavye kullanıcısı da görür), ~400ms gecikmeyle.
 * İçeriği bir ETİKETTİR, açıklama değildir. Açıklamalar yardım metninde
 * durur.
 *
 * **Bir tooltip hiçbir zaman tek başına bir bilginin kaynağı olamaz.** Bu
 * yüzden `IconButton` erişilebilir adı zorunlu kılar; tooltip yalnızca
 * ekrandan bakan fare kullanıcısına yardımcı olur.
 */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  label: string;
  children: ReactNode;
  placement?: TooltipPlacement;
  /** Kilitliyse tooltip hiç gösterilmez. */
  disabled?: boolean;
  className?: string;
}

const OPEN_DELAY_MS = 400;
const MAX_OPEN_MS = 600;

export function Tooltip({
  label,
  children,
  placement = 'bottom',
  disabled = false,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  function schedule() {
    if (disabled) return;
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      setOpen(true);
    }, OPEN_DELAY_MS);
  }

  function cancel() {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setOpen(false);
  }

  // `Esc` balonu kapatır (components.md).
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancel();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const autoClose = setTimeout(() => {
      setOpen(false);
    }, MAX_OPEN_MS);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(autoClose);
    };
  }, [open]);

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={schedule}
      onMouseLeave={cancel}
      onFocus={schedule}
      onBlur={cancel}
    >
      {open === true && disabled === false ? (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute z-dropdown w-max max-w-64',
            'rounded-lg bg-brand-dark px-2 py-1 text-caption text-content-inverse shadow-medium',
            // `top`/`bottom` YATAYDA ortalanır (`-translate-x-1/2`),
            // `left`/`right` DİKEYDE ortalanır (`-translate-y-1/2`). İki eksende
            // birbirine karıştırılırsa balon kaynağının yanlış tarafında
            // belirir; ikon rayında yanlış taraf ekran dışıdır ve balon
            // görünmez olur.
            placement === 'top' || placement === 'bottom'
              ? 'left-1/2 -translate-x-1/2'
              : 'top-1/2 -translate-y-1/2',
            placement === 'bottom' && 'top-[calc(100%+6px)]',
            placement === 'top' && 'bottom-[calc(100%+6px)]',
            // Yatay yerleşimde `right`: balon kaynağın SAĞINDA açılır, sola
            // değil — kenar çubuğu ekranın solundayken sola açılan balon
            // pencere dışına taşar.
            placement === 'right' && 'left-[calc(100%+8px)]',
            placement === 'left' && 'right-[calc(100%+8px)]',
          )}
        >
          {label}
        </span>
      ) : null}
      {open === true && disabled === false ? withDescribedBy(children, id) : children}
    </span>
  );
}

/**
 * Açıkken çocuğa `aria-describedby` ekler. Çocuk geçerli bir React elemanı
 * değilse (parçalı bir ağaç) bu atlanır — erişilebilir ad zaten `IconButton`'ın
 * `aria-label`'ındadır, bu yüzden eksikliği sessiz bir hata oluşturmaz.
 */
function withDescribedBy(children: ReactNode, id: string): ReactNode {
  if (!isValidElement(children)) {
    return children;
  }

  const props = children.props as Record<string, unknown>;
  const existing = props['aria-describedby'];

  return cloneElement(children as ReactElement<Record<string, unknown>>, {
    'aria-describedby': typeof existing === 'string' ? `${existing} ${id}` : id,
  });
}
