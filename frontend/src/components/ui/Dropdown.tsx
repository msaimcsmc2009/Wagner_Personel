import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Açılır menü — components.md §Dropdown / Menu.
 *
 * Tıklayınca açılır; dışarı tıklama, `Esc` veya seçimde kapanır. Kapanışta
 * odak tetikleyiciye döner.
 *
 * `role="menu"` + `role="menuitem"` YALNIZCA eylem menüleri içindir. Gezinme
 * bağlantıları için düz bir liste kullanılır — menü anlamı taklit edilmez.
 *
 * `header` slotu menünün üstünde, eylemlerden AYRI bir bilgi bloğu basar
 * (kullanıcı adı, rol). Bu blok `role="menu"` İÇİNDE olmaz: bir eylem
 * değildir, `menuitem` olmadığı için ekran okuyucu onu menü öğesi diye
 * saymaz. Rolü olmayan bir `div` + metin, ekran okuyucu için düz metindir.
 */
export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Yıkıcı eylem `danger-text` olur ve ayraçla ayrılır. */
  destructive?: boolean;
  disabled?: boolean;
  /** Öcesinde ince ayraç çizilir. */
  separated?: boolean;
}

export interface DropdownProps {
  /** Tetikleyicinin erişilebilir adı. */
  label: string;
  /** Verilirse tetikleyici ikon butonu olur. */
  icon?: ReactNode;
  /** Verilirse tetikleyici özel içerik taşır (avatar + ad gibi). */
  children?: ReactNode;
  /**
   * Menünün üstündeki bilgi bloğu. Kullanıcı menüsünde ad/rol buraya
   * gelir; eylem listesi yalnız yapılabilecekleri taşır.
   */
  header?: ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
  className?: string;
}

export function Dropdown({
  label,
  icon,
  children,
  header,
  items,
  align = 'end',
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Dışarı tıklama ve `Esc`.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: MouseEvent) => {
      const node = containerRef.current;
      if (node !== null && !node.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          setOpen((previous) => !previous);
        }}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-md',
          'transition-colors duration-fast',
          icon === undefined
            ? 'h-10 gap-2 px-3 text-label font-medium text-content-primary hover:bg-surface-sunken'
            : 'size-10 max-md:size-11 text-content-secondary hover:bg-surface-sunken hover:text-content-primary',
        )}
      >
        {icon}
        {children}
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-dropdown mt-1 min-w-50 overflow-hidden rounded-lg bg-surface p-1 shadow-medium',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {/*
            `role="menu"` YALNIZ eylem listesini sarar. Başlık bloğu ve
            ayraç dışarıda kalır; ekran okuyucu başlığı menü öğesi olarak
            saymaz ve her eylem doğru sırayı korur.
          */}
          {header !== undefined && (
            <div className="border-b border-line px-3 pt-2 pb-3">{header}</div>
          )}

          <div role="menu" id={menuId} aria-label={label} className="animate-menu-in">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled === true}
                onClick={() => {
                  if (item.disabled === true) return;
                  close();
                  item.onSelect();
                }}
                className={cn(
                  'flex h-9 w-full items-center gap-2 rounded-sm px-3 text-left text-body',
                  'transition-colors duration-fast',
                  'disabled:cursor-not-allowed disabled:text-content-disabled',
                  item.destructive === true
                    ? 'text-danger-text hover:bg-danger-soft'
                    : 'text-content-primary hover:bg-surface-sunken',
                  // Ayraç `border-t` yerine dolgu boşluğu + üst kenarlık
                  // olarak kalır; ilk öğeye yapışmaz.
                  item.separated === true && 'mt-1 border-t border-line pt-1',
                )}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
