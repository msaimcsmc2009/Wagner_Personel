import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { AlertCircleIcon } from '../icons/UiIcons';

/**
 * Form alanı ailesi — components.md §Input / forms.md.
 *
 * Kurallar:
 *  - **Görünür etiket her zaman vardır.** Placeholder yalnızca biçim
 *    örneğidir; tek başına etiket yerine geçmez.
 *  - Girdi yazı tipi **16px**'tir (`text-body-lg`). 14px'te iOS/Safari
 *    odakta sayfayı yakınlaştırır.
 *  - Doğrulama her tuşta değil, **blur ve submit** anında çalışır.
 *  - Hata, ipucunun YERİNİ alır ve alana bitişik gösterilir.
 *  - Etiketlerde `text-transform: uppercase` **kullanılmaz**: Türkçede
 *    noktasız `i → I` üretir, doğrusu `İ`'dir. Büyük harf kaynakta yazılır.
 *
 * `outline` burada hiçbir zaman kapatılmaz. Odak halkası
 * `styles/index.css` içindeki global `:focus-visible` kuralından gelir.
 *
 * ⚠ ODak İKİ HALKAYLA GÖSTERİLMEZ. Taban katman zaten 2px `#2E5CB8`
 *   `outline` + 2px ofset uygular. Üstüne bir `box-shadow` halkası
 *   eklemek iki odak göstergesi demektir; bu, gürültüdür ve hangisinin
 *   "gerçek" olduğunu belirsizleştirir. Bu yüzden odakta üçüncü bir
 *   gösterge yerine **yüzey tonu** değişir: `focus:bg-brand-50`
 *   (`#F1F5FE`, markanın en açık tonu).
 *
 *   Sonuç: kenarlık marka mavisine gider, zemin bir kademe ısınır, odak
 *   halkası global kural olarak kalır. Üçü birlikte "burada yazıyorsun"
 *   der — kalın bir neon çerçeveye gerek kalmadan.
 */
function controlClass(): string {
  return cn(
    'h-10 w-full rounded-md border bg-surface px-3 text-body-lg text-content-primary',
    'placeholder:text-content-muted',
    'transition-colors duration-fast',
    'border-line-strong hover:border-content-muted focus:border-brand focus:bg-brand-50',
    'aria-invalid:border-danger',
    'disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-disabled disabled:text-content-disabled',
    'read-only:bg-surface read-only:text-content-primary',
    // `readOnly` alan odaklanabilir ve seçilebilir kalmalıdır; yalnızca
    // yazılamaz. Odak tonu da bu alanda çalışır.
    'read-only:hover:border-line-strong',
  );
}

interface FieldFrameProps {
  label: string;
  hint?: string;
  /** Hata metni. Verildiğinde ipucunun yerini alır. */
  error?: string;
  required?: boolean;
  /** `htmlFor` ve `aria-describedby` için alan kimliği. */
  id: string;
  children: ReactNode;
  className?: string;
}

function FieldFrame({
  label,
  hint,
  error,
  required = false,
  id,
  children,
  className,
}: FieldFrameProps) {
  const describedById = error !== undefined ? `${id}-error` : hint !== undefined ? `${id}-hint` : undefined;

  return (
    <div className={cn('flex w-full flex-col', className)}>
      <label htmlFor={id} className="mb-2 block text-label font-medium text-content-secondary">
        {label}
        {required && (
          <span className="ml-1 text-danger-text" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {/* `id` doğrudan GÖRÜNÜR öğeye bağlanır. Metnin `sr-only` bir kopyası
          üretmek ekran okuyucuyu aynı mesajı iki kez okumaya zorlar. */}
      {error !== undefined ? (
        <p
          id={describedById}
          className="mt-1 flex items-start gap-1.5 text-body-sm text-danger-text"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint !== undefined ? (
        <p id={describedById} className="mt-1 text-body-sm text-content-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Etiketleme ve `aria-describedby` için alan kimliği. */
  fieldId?: string;
  /**
   * Girdinin SAĞ KENARINA yerleşen içerik: parolanın göster/gizle
   * düğmesi, birim seçici, temizleme düğmesi.
   *
   * Bu slot alanın İÇİNDEDİR ve `FieldFrame`'in altında kalır; yüzde
   * konumlandırma `Field` içinde çözülür, çağıran tarafta `absolute`
   * sınıfı yazılmaz.
   *
   * Erişilebilirlik: verilen düğme `type="button"` olmalı (aksi hâlde
   * formu gönderir), `aria-label` taşımalı ve dokunma hedefi en az 40px
   * olmalıdır. Çağıran bu sorumluluğu alır; bileşen yalnız yerleştirir.
   */
  endAdornment?: ReactNode;
  className?: string;
};

export function TextField({
  label,
  hint,
  error,
  required = false,
  fieldId,
  endAdornment,
  className,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const id = fieldId ?? generatedId;
  const describedBy =
    error !== undefined ? `${id}-error` : hint !== undefined ? `${id}-hint` : undefined;

  const input = (
    <input
      {...inputProps}
      id={id}
      // ⚠ `required` YALNIZCA görsel yıldız için `FieldFrame`'e verilirse,
      // alan ekran okuyucuya "zorunlu" diye BİLDİRİLMEZ ve `:invalid`
      // durumu oluşmaz. Yıldız `aria-hidden` olduğu için bu bilginin
      // tek aktarım yolu `required` niteliğidir. Aşağıya özellikle
      // konur; `{...inputProps}` bunu taşımaz (yukarıda çıkarıldı).
      required={required}
      aria-invalid={error !== undefined || undefined}
      aria-describedby={describedBy}
      // Sağdaki içerik girdinin metnini EZMELİ: dolgu boşluğu
      // (`pr-11`) burada genişletilir.
      className={cn(controlClass(), endAdornment !== undefined && 'pr-11')}
    />
  );

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      required={required}
      id={id}
      className={className}
    >
      {/*
        Süsleme varsayılan olarak doğrudan girdidir. Konumlandırılmış bir
        katmana ihtiyaç varsa `relative` sarmalayıcı devreye girer; bu,
        konumu bileşenin içinde tutar.
      */}
      {endAdornment === undefined ? (
        input
      ) : (
        <div className="relative">
          {input}
          <span className="absolute inset-y-0 right-1 flex items-center">{endAdornment}</span>
        </div>
      )}
    </FieldFrame>
  );
}

export type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  fieldId?: string;
  className?: string;
};

export function SelectField({
  label,
  hint,
  error,
  required = false,
  fieldId,
  className,
  children,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = useId();
  const id = fieldId ?? generatedId;
  const describedBy =
    error !== undefined ? `${id}-error` : hint !== undefined ? `${id}-hint` : undefined;

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      required={required}
      id={id}
      className={className}
    >
      <select
        {...selectProps}
        id={id}
        // `TextField` ile aynı gerekçe: zorunluluk ekran okuyucuya yalnızca
        // bu nitelikle aktarılır.
        required={required}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={describedBy}
        className={cn(controlClass(), 'cursor-pointer')}
      >
        {children}
      </select>
    </FieldFrame>
  );
}
