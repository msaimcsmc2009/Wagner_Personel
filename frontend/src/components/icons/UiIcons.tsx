import type { SVGProps } from 'react';

/**
 * Arayüz ikonları.
 *
 * AGENTS.md reddedilenler listesinde "emoji as interface icon" yasak.
 * Arayüz ikonları bu yüzden daima SVG'dir; ikon boyutu token'lıdır
 * (`size-4` = 16px, `size-5` = 20px) ve `currentColor` izler.
 *
 * `aria-hidden` varsayılandır: dekoratif ikon ekran okuyucuya okunmaz.
 * Yalnızca ikonun KENDİSİ anlam taşıyorsa (tek başına buton gibi) çağıran
 * bileşen erişilebilir adı (`aria-label`) sağlamakla yükümlüdür.
 *
 * İkon seti bilinçli olarak küçük tutulur: her eklenen ikon, gerekmeden
 * büyüyen bir yüzeydir. Bulunmayan bir ikon için yeni bir path uydurulmaz;
 * mevcut en yakın ikon kullanılır veya ikon metin olmadan bırakılır.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Yükleme göstergesi. `role="status"` her zaman çağıranın sorumluluğundadır. */
export function SpinnerIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx={12} cy={12} r={9} opacity={0.25} />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m4 12 5 5L20 6" />
    </Base>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Base>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </Base>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Base>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Base>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 9 6 6 6-6" />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 18 6-6-6-6" />
    </Base>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx={12} cy={12} r={3} />
    </Base>
  );
}

/**
 * Kapalı göz — parolanın GÖSTERİLMEKTE olduğu an.
 *
 * `EyeIcon` ile bir çift oluşturur. İkon tek başına durumu değil, o
 * duruma GEÇİŞİ anlatır: göz açıkken "şifre gizli, gösterilebilir", göz
 * kapalıyken "şifre açık, gizlenebilir". Metin olmadan yön değiştirdiği
 * için düğmenin `aria-label`'i de buna göre yazılır (components.md:
 * ikon-only düğme erişilebilir ad taşır).
 */
export function EyeOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx={12} cy={12} r={3} />
      <path d="M3 3l18 18" />
    </Base>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Base>
  );
}

export function MoreHorizontalIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx={5} cy={12} r={1} fill="currentColor" />
      <circle cx={12} cy={12} r={1} fill="currentColor" />
      <circle cx={19} cy={12} r={1} fill="currentColor" />
    </Base>
  );
}

/** Boş durum ikonu. components.md: 48px, `text-muted`, asla marka renginde. */
export function UsersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M22 20v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Base>
  );
}

/* --------------------------------------------------------------------------
   Uygulama kabuğu ikonları
   --------------------------------------------------------------------------
   Aynı 24 grid ve 2px stroke dili sürdürülür; tutarlılık için ölçek değişmez.
   -------------------------------------------------------------------------- */

/** Kontrol paneli ana sayfası. */
export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
    </Base>
  );
}

/** Departman — bina. */
export function BuildingIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
      <path d="M14 9h4a2 2 0 0 1 2 2v10" />
      <path d="M8 7h2" />
      <path d="M8 11h2" />
      <path d="M8 15h2" />
      <path d="M3 21h18" />
    </Base>
  );
}

/** İzin ve vardiya takvimi. */
export function CalendarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x={3} y={5} width={18} height={16} rx={2} />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </Base>
  );
}

/** Raporlar — dikey çubuklar. Not: donut/3-D değil, salt çubuk. */
export function BarChartIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 21V10" />
      <path d="M10 21V4" />
      <path d="M16 21v-7" />
      <path d="M22 21H2" />
    </Base>
  );
}

/** Oturumu kapat. */
export function LogOutIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Base>
  );
}

/** Bildirim. Sayı rozeti `danger` zeminlidir, asla marka mavisi. */
export function BellIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Base>
  );
}

/** Yardım. */
export function HelpCircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </Base>
  );
}

/** Mobil/masaüstü geçişinde sidebar'ı açan hamburger. */
export function MenuIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </Base>
  );
}

/** Filtre — huni. */
export function FilterIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
    </Base>
  );
}

/** Sil — `danger-text` rengiyle, `⋯` menüsü içinde kullanılır. */
export function TrashIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" />
      <path d="M9 7V4h6v3" />
    </Base>
  );
}

/** Dışa aktar. */
export function DownloadIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 21h16" />
    </Base>
  );
}

/** Sayfalamada önceki sayfa. */
export function ChevronLeftIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m15 18-6-6 6-6" />
    </Base>
  );
}

/** Sayfalamada sonraki sayfa. */
export function ChevronRightSmallIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m9 18 6-6-6-6" />
    </Base>
  );
}

/**
 * Sıralama göstergesi. `direction` verilmezse çift yönlü (sıralanabilir
 * kolon), verilirse tek yönlü ve o yöne bakan oka döner.
 */
export function SortIcon({
  direction,
  ...props
}: IconProps & { direction?: 'asc' | 'desc' | null }) {
  return (
    <Base {...props}>
      <path d="m7 20 5-5 5 5" opacity={direction === 'asc' ? 1 : 0.28} />
      <path d="m7 4 5 5 5-5" opacity={direction === 'desc' ? 1 : 0.28} />
    </Base>
  );
}

/** Kayıt arşivleme / pasifleştirme. */
export function ArchiveIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x={3} y={4} width={18} height={4} rx={1} />
      <path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </Base>
  );
}

/** E-posta gönder. */
export function MailIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x={3} y={5} width={18} height={14} rx={2} />
      <path d="m3 7 9 6 9-6" />
    </Base>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v5h-5" />
    </Base>
  );
}

/** Metin arama sonucunu temizle. */
export function XCircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </Base>
  );
}

/** Üç durumlu onay kutusundaki "kısmi seçili" tire işareti. */
export function MinusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 12h14" />
    </Base>
  );
}
