import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { CheckIcon, MinusIcon } from '../icons/UiIcons';

/**
 * Onay kutusu — components.md §Checkbox.
 *
 * 18×18, `radius-sm` 4, kenarlık `line-strong`. İşaretli: `brand` dolgu +
 * beyaz onay. Belirsiz (indeterminate): `brand` dolgu + tire — tablo
 * başlığındaki "tümünü seç" üç durumlu kutusu bunu kullanır.
 *
 * Etiket kutuyu sarar; tıklama hedefi metin + kutu olarak bütündür.
 * Renk tek başına anlam taşımaz, işaret şekli de taşır.
 */
export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Üç durumlu başlık kutusu için. */
  indeterminate?: boolean;
  label?: ReactNode;
  /** Erişilebilir ad. Etiket görsel olarak gizliyse ZORUNLUDUR. */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  indeterminate = false,
  label,
  ariaLabel,
  disabled = false,
  className,
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  // `indeterminate` DOM özelliğidir; React'te öznitelik olarak karşılanmaz.
  useEffect(() => {
    if (ref.current !== null) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const control = (
    <span className="relative inline-flex size-4.5 shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        className={cn(
          'peer absolute inset-0 size-full cursor-pointer appearance-none rounded-sm border bg-surface',
          'border-line-strong transition-colors duration-fast',
          'hover:border-content-muted',
          'checked:border-brand checked:bg-brand',
          'indeterminate:border-brand indeterminate:bg-brand',
          'disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-disabled',
        )}
      />
      {indeterminate ? (
        <MinusIcon className="pointer-events-none relative size-3 text-content-inverse" />
      ) : checked ? (
        <CheckIcon className="pointer-events-none relative size-3 text-content-inverse" />
      ) : null}
    </span>
  );

  if (label === undefined) {
    return <span className={cn('inline-flex', className)}>{control}</span>;
  }

  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 text-body text-content-primary',
        disabled === true && 'cursor-not-allowed text-content-disabled',
        className,
      )}
    >
      {control}
      <span>{label}</span>
    </label>
  );
}
