import type { ReactNode } from 'react';
import { ArchiveIcon, HomeIcon, UsersIcon } from '../components/icons/UiIcons';

/**
 * Uygulama gezinmesi — layout.md §2.
 *
 * Bölüm etiketleri kaynakta **zaten büyük harfle** yazılmıştır ve CSS
 * `uppercase` DÖNÜŞÜMÜ KULLANILMAZ. Türkçede noktasız `i → I` üretildiği
 * için küçük harften büyütmek "Isletme → ISLETME" gibi hatalı sonuç verir.
 * Doğrusu `İŞLETME`'dir ve bu kaynakta öyle yazılır.
 *
 * ⚠ KAPSAM: menüde YALNIZCA personel SAYISI vardır. Personeller, Departmanlar,
 * İzinler ve Eğitim girdileri kaldırıldı ve bilinçli olarak geri
 * getirilmeyecektir. Bu uygulamada personel kaydı tutulmaz; yalnızca
 * "Üretim" ve "Endirekt" için toplam sayı saklanır.
 *
 * "Eski Kayıtlar" ayrı bir menü girdisidir, dashboard içinde bir kart
 * DEĞİLDİR. Gerekçesi: geçmiş kendi sorusunu soran, kendi filtresi olan
 * ve büyümeye devam eden bir ekrandır; dashboard'un güncel durum
 * sorusunun içine sıkıştırılmış bir bölüm olamaz.
 *
 * ⚠ "Raporlar" GİRDİSİ KALDIRILDI (route, sayfa ve breadcrumb etiketiyle
 * birlikte). Bir "rapor" üretecek veri kaynağı YOKTUR: uygulama iki
 * toplam sayı saklar, zaman serisi tutmaz ve tarih aralığına göre
 * sorgulanabilir bir olay tablosu içermez. Menüde duran bir rapor girdisi,
 * tıklandığında boş bir ekran açan bir vaattir; bu, `EmptyState`ten daha
 * kötüdür çünkü kullanıcı oraya GİTMEYİ seçmiştir.
 *
 * Raporlar, arkasında gerçekten hesaplanabilir bir veri modeli
 * (zaman serisi + filtre + toplamlar) olduğunda geri gelmelidir.
 *
 * ⚠ "AYARLAR" GİRDİSİ VE "SİSTEM" BÖLÜMÜ KALDIRILDI.
 *
 *   `/ayarlar` bir `EmptyState` stub'ıydı: ayar tutan, saklayan ya da
 *   okuyan hiçbir şey yoktu. Menüde bir girdi, tıklandığında boş bir ekran
 *   açıyorsa vaadi yerine getirmiyor demektir — bu yüzden girdi, route,
 *   sayfa ve breadcrumb etiketi birlikte kaldırıldı.
 *
 *   ⚠ AYARLAR GERİ GELMEYECEKTİR. Gerçek bir ayar yüzeyi ancak arkasında
 *     KAYDEDİLEBİLİR bir ayar olduğunda anlamlıdır. Bu uygulamada kalıcı
 *     kullanıcı tercihi yoktur; oturum tercihleri tarayıcıda tutulur ve
 *     sunucuya yazılmaz.
 *
 *   Menü TEK bölümden oluşur. `SİSTEM` başlığı, altında tek bir girdi
 *   varken kaldırılmıştır: iki bölümlü ama bir elemanlı bir menü, hiç
 *   bölümlenmemiş menüden daha yalnız ve daha bozuk görünür.
 */
export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  /** Bekleyen iş sayısı. Rozet `danger` zeminlidir — uyarı, marka vurgusu değil. */
  badge?: number;
  /**
   * Yalnızca yöneticilere açık ekran.
   *
   * Bu bayrak MENÜYÜ GİZLER, yönlendirmeyi değil. `Sidebar` bu girdileri
   * yönetici olmayan kullanıcılardan çıkarır.
   *
   * ⚠ Neden gizlemek, neden "tıklayınca hata ver" değil: tıklanabilir ama
   *   işe yaramayan bir menü girdisi, kullanıcıya sistemden daha çok
   *   söyler. "Yönetici olmadığım için buraya giremiyorum" bilgisi menüde
   *   ZATEN vardır; ikinci bir kez, üstelik bir hata olarak verilmesi
   *   gereksizdir. Adres çubuğuna doğrudan yazılan bağlantılar için
   *   `ProtectedRoute` yetki ekranını gösterir.
   *
   * NOT: `/personel-sayilari` BU BAYRAKTA DEĞİLDİR. Sayıları okumak her
   * giriş yapmış kullanıcıya açıktır; yalnızca DEĞER DEĞİŞTİRMEK
   * yöneticilere aittir ve bu ayrım ekranın içinde uygulanır.
   */
  requiresAdmin?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'GENEL',
    items: [
      { label: 'Dashboard', to: '/', icon: <HomeIcon className="size-5" /> },
      {
        label: 'Personel Sayıları',
        to: '/personel-sayilari',
        icon: <UsersIcon className="size-5" />,
      },
      {
        label: 'Eski Kayıtlar',
        to: '/gecmis',
        icon: <ArchiveIcon className="size-5" />,
      },
    ],
  },
];

/** Breadcrumb için yol → etiket eşlemesi. `layout.md §4`. */
export const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/gecmis': 'Eski Kayıtlar',
  '/personel-sayilari': 'Personel Sayıları',
  '/durum': 'Sistem Durumu',
};
