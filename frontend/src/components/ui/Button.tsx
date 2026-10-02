import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { SpinnerIcon } from '../icons/UiIcons';

/**
 * Buton — components.md §Button.
 *
 * Beş varyant, üç boyut. Tümü hover / active / disabled / loading durumunu
 * taşır. Odak halkası `styles/index.css` içindeki global `:focus-visible`
 * kuralından gelir; burada `outline` tanımlanmaz.
 *
 * `type` varsayılan olarak `"button"`: bir form içinde yanlışlıkla
 * gönderim tetiklemek en sık görülen buton hatasıdır.
 *
 * ⚠ GEÇİŞ YALNIZCA RENK DEĞİL. `transition-colors` yetmez: butonun
 *   "kalkacağını" bildirmesi gereken tek hareket gölgedir. Bu yüzden geçiş
 *   `background-color, border-color, color, box-shadow, transform` için
 *   tanımlıdır.
 *
 * ⚠ ÖLÇEK. `hover:scale-[1.01]` bilinçli olarak 1.01'de tutulur. 1.03 ve
 *   üzeri bir buton, tıklanabilir yüzeyi "yükseliyor" gibi gösterir ve
 *   kurumsal bir üründe çocuksu durur. `active:scale-[0.98]` basma
 *   geri bildirimidir: tıklamanın gerçekleştiğini fiziksel olarak söyler.
 *
 *   Ölçek `disabled:` durumunda `scale-100` ile geri alınır; devre dışı bir
 *   buton üzerinde gezdirildiğinde kalkmamalıdır.
 *
 *   `link` ve `ghost` varyantları ölçeklenmez: metin eylemleri yerinde
 *   durmalıdır, zıplamamalıdır.
 *
 * ⚠ `cn()` TAILWIND ÇAKIŞMALARINI ÇÖZMEZ (`lib/cn.ts`). Bir varyantın hem
 *   `transition-colors` hem geniş geçiş taşıması sessizce yanlış olanı
 *   kazandırır. Bu yüzden geçiş TEK dalda, taban sınıflarda tanımlıdır.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-content-inverse hover:bg-brand-hover hover:scale-[1.01] hover:shadow-subtle active:bg-brand-active active:scale-[0.98] disabled:scale-100 disabled:bg-content-disabled disabled:text-content-inverse disabled:shadow-none',
  secondary:
    'border border-line-strong bg-surface text-content-brand hover:scale-[1.01] hover:bg-surface-sunken hover:shadow-subtle active:scale-[0.98] active:bg-line disabled:scale-100 disabled:border-line disabled:bg-surface-disabled disabled:text-content-disabled disabled:shadow-none',
  ghost:
    'bg-transparent text-content-brand hover:bg-brand-soft active:bg-brand-soft-hover disabled:text-content-disabled',
  danger:
    'bg-danger text-content-inverse hover:bg-danger-hover hover:scale-[1.01] hover:shadow-subtle active:bg-danger active:scale-[0.98] disabled:scale-100 disabled:bg-content-disabled disabled:text-content-inverse disabled:shadow-none',
  link: 'bg-transparent text-link hover:text-content-brand hover:underline disabled:text-content-disabled',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-label',
  md: 'h-10 gap-2 px-4 text-label',
  lg: 'h-12 gap-2 px-5 text-body',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Yükleme sırasında buton genişliği korunur; etiket spinner ile değişir. */
  loading?: boolean;
  /** `loading` sırasında gösterilecek metin. Verilmezse `children` kalır. */
  loadingText?: string;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  loadingText,
  iconStart,
  iconEnd,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled === true || loading;

  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap',
        // Geniş geçiş: renk + gölge + ölçek. `transition-colors` YAZILMAZ
        // (yukarıdaki uyarı).
        'transition-[background-color,border-color,color,box-shadow,transform] duration-fast',
        'disabled:cursor-not-allowed',
        SIZE_CLASS[size],
        VARIANT_CLASS[variant],
        // `link` varyantında ikon ve dolgu görsel gürültü yaratır.
        variant === 'link' && 'px-0',
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <SpinnerIcon className="size-4 shrink-0" /> : iconStart}
      {loading ? (loadingText ?? children) : children}
      {loading ? null : iconEnd}
    </button>
  );
}
