import { cn } from '../../lib/cn';

/**
 * Avatar — components.md §Avatar.
 *
 * Fotoğraf YOK: `src` verilmezse baş harfler gösterilir. 248 satırda tekrar
 * eden sahte bir kişi ikonu, initials'ten daha kötüdür.
 *
 * Baş harfler `bg-brand-soft` üzerinde `text-brand` ile gelir — marka rengi
 * bir dekoratif kutu olarak değil, kimliğin taşıyıcısı olarak kullanılır.
 *
 * Erişilebilirlik: isim zaten satırda/header'da yanında olduğu için avatar
 * dekoratif sayılır ve `aria-hidden` olur. Tek başına kullanılacaksa
 * `name` verilmelidir.
 */
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: 'size-6 text-caption',
  md: 'size-8 text-body-sm',
  lg: 'size-10 text-body',
  xl: 'size-16 text-h2',
};

/** "Büşra Korkmaz Demir" → "BK". Üç ve üzeri kelimede ilk iki kelimenin başı. */
export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter((part) => part.length > 0);
  const first = parts[0];
  const second = parts[1];
  if (first === undefined) return '?';
  if (second === undefined) return first.slice(0, 2).toLocaleUpperCase('tr-TR');
  return `${first[0] ?? ''}${second[0] ?? ''}`.toLocaleUpperCase('tr-TR');
}

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  /** Varsa sağ altta durum noktası. Renk yanına metin/rozet de verilmelidir. */
  presence?: 'online' | 'away' | 'offline' | null;
  className?: string;
}

const PRESENCE_CLASS: Record<NonNullable<AvatarProps['presence']>, string> = {
  online: 'bg-success',
  away: 'bg-warning',
  offline: 'bg-content-disabled',
};

const PRESENCE_DOT_SIZE: Record<NonNullable<AvatarProps['presence']>, string> = {
  online: 'size-2.5',
  away: 'size-2.5',
  offline: 'size-2.5',
};

export function Avatar({ name, size = 'lg', presence = null, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full',
        'bg-brand-soft font-medium text-content-brand',
        SIZE_CLASS[size],
        className,
      )}
    >
      {initialsOf(name)}
      {presence !== null && (
        <span
          className={cn(
            'absolute right-0 bottom-0 rounded-full ring-2 ring-surface',
            PRESENCE_CLASS[presence],
            PRESENCE_DOT_SIZE[presence],
          )}
        />
      )}
    </span>
  );
}
