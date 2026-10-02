import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Tooltip } from './Tooltip';

/**
 * İkon butonu — components.md §Icon button.
 *
 * `label` ZORUNLUDUR. Metinsiz bir ikon butonu bağlam dışında anlamsızdır
 * ("Düzenle" neyi düzenliyor?), bu yüzden erişilebilir adı burada zorunlu
 * kılıyoruz: çağıran kişinin adını da verirsek
 * ("Ahmet Yılmaz kaydını düzenle") anlam korunur.
 *
 * Dokunma hedefi mobilde 44×44'e çıkar.
 *
 * `touchTarget={false}` bu büyütmeyi kapatır. Alan İÇİNDE kullanılan
 * dekoratif ikonlarda (ör. parolanın göster/gizle düğmesi) buton zaten bir
 * 40px girdinin sağına yerleşir; 44px'e çıkarmak düğmeyi alanın dışına
 * taşırır ve hedefi bozar.
 *
 * `pressed` iki durumlu bir düğmeyi (`aria-pressed`) bildirir: kapalı/açık,
 * göster/gizle, sessiz/sesli. Etiket `pressed` durumuna göre YAZILIR
 * ("Şifreyi göster" ↔ "Şifreyi gizle"), çünkü ikon tek başına o anki
 * durumu değil, o duruma GEÇİŞİ anlatır.
 *
 * YIKICI eylem için `variant="danger"` kullanılabilir, ancak bu bileşen
 * tabloda asla tek başına kırmızı sil ikonu olarak kullanılmaz — sil her
 * zaman `⋯` menüsündedir (tables.md §5).
 */
export type IconButtonSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
};

export interface IconButtonProps {
  /** Erişilebilir ad. KİŞİNİN adını da içermelidir. */
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  size?: IconButtonSize;
  variant?: 'ghost' | 'secondary' | 'danger';
  disabled?: boolean;
  /** Kenarlıklı kare ikon butonu. */
  bordered?: boolean;
  /** İki durumlu düğmede seçili durum. `aria-pressed` olarak bildirir. */
  pressed?: boolean;
  /** Mobilde 44px dokunma hedefine büyüt. Alan içi dekoratif düğmede kapatılır. */
  touchTarget?: boolean;
  className?: string;
}

const VARIANT_CLASS = {
  ghost: 'text-content-secondary hover:bg-surface-sunken hover:text-content-primary active:bg-line',
  secondary:
    'border border-line-strong bg-surface text-content-brand hover:bg-surface-sunken active:bg-line',
  danger: 'text-danger-text hover:bg-danger-soft active:bg-danger-soft',
} as const;

export function IconButton({
  label,
  icon,
  onClick,
  size = 'md',
  variant = 'ghost',
  disabled = false,
  bordered = false,
  pressed,
  touchTarget = true,
  className,
}: IconButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-md',
          'transition-colors duration-fast',
          'disabled:cursor-not-allowed disabled:text-content-disabled',
          touchTarget && 'max-md:size-11',
          SIZE_CLASS[size],
          bordered && 'rounded-md',
          VARIANT_CLASS[variant],
          className,
        )}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
