import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { NAV_SECTIONS } from '../../config/navigation';
import { userDisplayName, userRoleLabel } from '../../lib/user';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { LogOutIcon } from '../icons/UiIcons';

/**
 * Kenar çubuğu — layout.md §2, responsive.md §2.
 *
 * KOYU LACİVERT YÜZEY. `brand-dark` #0C1832, üründeki TEK BÜYÜK lacivert
 * blok; geri kalan her yer beyaz veya açık gri.
 *
 * Neden bu kadar koyu: sayfa `#F8FAFC` + `#FFFFFF` yüzeylerden oluşur ve
 * hepsi birbirine yakın değerde. Ekranda tek başına "bir yer" olacak bir
 * renk olmadığında hiçbir şey öne çıkmaz; gözün ilk durağı belli olmaz.
 * Koyu kenar çubuğu o durağı kurar ve marka varlığını bir renk bloğuyla,
 * logoyu ve menüyü boyamadan verir.
 *
 * Bu, markanın ARANI düzlemine değil, "varlığını bir yüzey olarak
 * göstermeye" karar verir: `#092C74` rengin %8'i kadar bir alan kaplar.
 * Geri kalan %92 nötr kalır. Yani "mavi bir site" değil, beyaz bir sitede
 * tek bir koyu denge noktası.
 *
 * ETKİN ÖĞE İKİ İŞARETİ BİRDEN TAŞIR (layout.md §2):
 *   1. `brand` #092C74 zemin + beyaz metin
 *   2. 3px `brand-light` #C9D8F8 sol ray
 * Zemin tek başına YETMEZ: `brand` #092C74 ile zemin `brand-dark` #0C1832
 * ikisi de koyu lacivert, aralarındaki fark gözle zor yakalanır. Asıl
 * ayırt eden 3px açık mavi ray'dır — o yüzden ray kaldırılmaz, güçlendirilir.
 *
 * ÜÇ KİP (responsive.md §2):
 *   < 1024px        → 280px off-canvas drawer (hamburger ile açılır)
 *   1024 – 1279px   → 64px İKON RAYI, her öğede tooltip
 *   ≥ 1280px        → 256px genişletilmiş
 *
 * İkon rayı bir "küçültülmüş menü" DEĞİLDİR: etiketler DOM'dan KALDIRILIR,
 * yalnız ikon kalır ve her öğe kendi adını tooltip ile taşır. Kırpmak yerine
 * kaldırmak tercih edilmiştir — sıkışık bir genişlikte metin sığmıyorsa
 * kırpılmış metin, etiketsiz bir ikondan daha kötüdür (tooltip yavaşlar).
 *
 * Koyu yüzeyde metin ve kenarlık için AÇIK yüzey token'ları KULLANILMAZ
 * (`content-secondary` #475569 burada okunmaz). `on-dark*` ailesi kullanılır;
 * değerler `index.css` @theme bloğunda tanımlıdır.
 *
 * Dokunma hedefleri: drawer modunda öğe yüksekliği 44px'dir (responsive.md §4,
 * Apple HIG taban değeri). 40px yalnız fare için geçerlidir.
 *
 * ⚠ YETKİLİ GİRDİLER FİLTRELENİR. `requiresAdmin` işaretli menü girdileri
 *   yönetici olmayan kullanıcıda çizilmez. Tıklanabilir ama işe yaramayan
 *   bir bağlantı, sistemden daha çok şey söyler: kullanıcı neden
 *   giremediğini arar. Adres çubuğuna doğrudan yazılan bağlantılar için
 *   `ProtectedRoute` yetki ekranı vardır.
 *
 * ⚠ KULLANICI BİLGİSİ SABİT DEĞİLDİR. Ad ve rol `AuthContext`'ten gelir
 *   (backend `GET /api/auth/me`). Kim giriş yaparsa yapsın ekranda O
 *   görünür.
 */
export interface SidebarProps {
  /** Mobil drawer açık mı. Masaüstünde yok sayılır. */
  open: boolean;
  onNavigate: () => void;
}

/** responsive.md §2: 1024–1279px arası ikon rayı. */
const RAIL_QUERY = '(min-width: 1024px) and (max-width: 1279px)';

export function Sidebar({ open, onNavigate }: SidebarProps) {
  /*
   * Genişlik değişiminde mod değişir. `matchMedia` tek kaynaktır; CSS ile
   * ayrıca bir kopya yazılmaz, çünkü iki kaynak birbirini güncellemez ve
   * ekran döndürüldüğünde etiketler yalnız CSS'e göre gizli kalır.
   */
  const isRail = useMediaQuery(RAIL_QUERY);

  const { user, isAdmin, signOut } = useAuth();

  const displayName = userDisplayName(user);
  const roleLabel = userRoleLabel(user?.role);

  /*
    Bölüm, görünür girdi kalmadıysa başlığıyla birlikte da çizilmez.
    Boş bir "SİSTEM" başlığı, altında hiçbir şey olmayan bir başlıktır.
  */
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.requiresAdmin !== true || isAdmin),
  })).filter((section) => section.items.length > 0);

  const handleSignOut = () => {
    void signOut();
  };

  return (
    <div
      className={cn(
        // `wk-on-dark` odak halkasını ve kaydırma çubuğunu bu yüzeye uyarlar
        // (index.css). Koyu yüzey kuralı CSS'te, renk seçimi burada.
        'wk-on-dark flex flex-col bg-brand-dark',
        // Mobil: çeviri + gizli. Masaüstü: `sticky` ve ekran yüksekliği kadar —
        // kullanıcı bloğu uzun bir sayfada da görüş alanından çıkmaz.
        //
        // Genişlik: temel 280px (drawer), `lg` 64px (ikon rayı), `xl` 256px.
        // `100vw` KULLANILMAZ: kaydırma çubuğunu içerir ve yatay taşma üretir.
        'fixed inset-y-0 left-0 z-drawer h-dvh w-70 transition-transform duration-base',
        'lg:sticky lg:top-0 lg:z-base lg:h-dvh lg:w-16 lg:translate-x-0',
        'xl:w-64',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/*
        Logo alanı.

        ⚠ `WK` kutusu ve "Wagner Kablo / Personel Yönetim" yazısı
        KALDIRILDI; yerine gerçek logo geldi: `01-wagnerlogo.png`
        (`frontend/public/` → `/01-wagnerlogo.png`).

        Neden logo burada ÇALIŞIR: görüntünün görünür pikselleri beyazdır,
        arka planı şeffaftır. Kenar çubuğu `brand-dark` #0C1832 olduğu için
        beyaz çizim okunur. Açık bir zemine konulsaydı tamamen görünmezdi.

        ÖLÇEK — üç kip, üç boyut, hiçbirinde EĞİLME yok:
          - Drawer/Geniş (≥256px): `h-16` → logo 64px yükseklik, oran korunur
          - İkon rayı (64px): `h-6` → 24px; 64px'lik sütunda daha büyük
            bir logo sığmaz, kırpılmış logo etiketsiz bir ikondan kötüdür
        `width`/`height` öznitelikleri oranı tarayıcıya bildirir ve
        `object-contain` oranı korur: görüntü asla gerilmez veya eğilmez.
        Kaynak 620px geniş olduğu için hiçbir ölçekte büyütülmez —
        büyütme bulanıklık yaratırdı.

        Erişilebilir ad `alt` ile taşınır; ayrıca bir `sr-only` metin
        GEREKMEZ çünkü artık gerçek bir görüntü var.
      */}
      <div
        className={cn(
          'flex shrink-0 items-center',
          // Geniş kipte marka başlığa daha fazla yer alır; ray kipinde yer
          // dar olduğu için yükseklik korunur.
          'h-16 xl:h-24',
          isRail ? 'justify-center' : 'gap-3 px-5',
        )}
      >
        <img
          src="/01-wagnerlogo.png"
          alt="Wagner Kablo Personel Yönetim"
          width={620}
          height={400}
          className={cn(
            'h-auto max-w-full object-contain',
            isRail ? 'w-10' : 'w-36',
          )}
        />
      </div>

      {/* Ayırıcı, logo ile gezinme arasındaki ilişkiyi kurar. Açık yüzeydeki
          `line` rengi koyuda görünmez; burada beyazın %12'si kullanılır. */}
      <div aria-hidden="true" className="h-px shrink-0 bg-on-dark-line" />

      {/* Gezinme */}
      <nav aria-label="Ana gezinme" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {sections.map((section, sectionIndex) => (
          <div key={section.label} className={cn(sectionIndex > 0 && 'mt-7')}>
            {/*
              Bölüm başlığı kaynakta BÜYÜK HARFLE yazılır; CSS `uppercase`
              DÖNÜŞÜMÜ KULLANILMAZ (Türkçe `i → I` sorunu).

              Ray modunda başlık yerine ince bir ayırıcı konur: 64px'lik bir
              sütunda "GENEL" yazısı ya taşar ya da okunmaz biçimde kırpılır.
              Gruplar arası boşluk zaten görsel gruplamayı verir.
            */}
            {isRail ? (
              sectionIndex > 0 && (
                <div aria-hidden="true" className="mx-auto mb-3 h-px w-6 bg-on-dark-line" />
              )
            ) : (
              <p className="mb-2 px-3 text-caption font-medium tracking-wider text-on-dark-muted">
                {section.label}
              </p>
            )}

            {isRail && (
              // Bölüm adı görünmese de ekran okuyucuya grupları bildirilir.
              <span className="sr-only">{section.label}</span>
            )}

            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const link = (
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center rounded-md text-body',
                        'transition-colors duration-fast',
                        isRail
                          ? 'mx-auto size-10 justify-center'
                          : 'h-11 gap-3 px-3 lg:h-10',
                        /*
                          3px sol ray geometrisi HER ZAMAN tanımlıdır ki
                          `transition-colors` nereden nereye gittiğini
                          bilsin. Rengi ise TEK DALLA verilir.
                        */
                        'before:absolute before:inset-y-1.5 before:left-0 before:w-[3px]',
                        'before:rounded-full',
                        'before:transition-colors before:duration-fast',
                        // Etkin: koyu lacivert zemin + beyaz metin + AÇIK MAVI
                        // RAY. Üçü birden; zemin tek başına yetersiz çünkü
                        // `brand` ile zemin `brand-dark` ikisi de koyu lacivert.
                        //
                        // ⚠ `before:bg-transparent` ve `before:bg-brand-light`
                        // ASLA aynı anda yazılmaz. `cn` çakışma çözmüyor
                        // (lib/cn.ts): iki zıt `before:bg-*` sınıfı yazılırsa
                        // hangisinin kazandığı CSS KAYNAK SIRASINA bağlıdır,
                        // sınıf sırasına değil — ve sessizce yanlış olan kazanır.
                        // Bu yüzden renk dala göre ayrı ayrı verilir.
                        isActive
                          ? cn(
                              'bg-brand font-medium text-on-dark-strong',
                              // Ray modunda 40px'lik kare vurgulanır: dolgu
                              // 40px'lik bir kare olarak okunur, 3px ray
                              // görünmez olur.
                              isRail ? 'rounded-md' : 'before:bg-brand-light',
                            )
                          : cn(
                              'text-on-dark hover:bg-on-dark-hover hover:text-on-dark-strong',
                              'before:bg-transparent',
                            ),
                      )
                    }
                  >
                    {/*
                      İkon metnin rengini İZLEMEZ; `currentColor` ile devralır.
                      Ayrı bir renk atamak ikon ile metnin arasındaki bağı
                      koparır ve ikonu dekoratif süsleme haline getirir.
                    */}
                    <span
                      aria-hidden="true"
                      className="flex shrink-0 items-center justify-center transition-colors duration-fast"
                    >
                      {item.icon}
                    </span>

                    {!isRail && <span className="truncate">{item.label}</span>}

                    {!isRail && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-caption font-medium text-content-inverse"
                        aria-label={`${item.badge} bekleyen talep`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );

                /*
                  Ray modunda etiket yoktur; tooltip O ADIN taşır. Tooltip
                  hover VE FOCUS ile açılır, yani klavye kullanıcısı da görür.
                  Ayrıca `NavLink` kendi `aria-label`'ını korur — tooltip
                  tek başına bilgi kaynağı olmaz (components.md).
                */
                return (
                  <li key={item.to} className={cn(isRail && 'flex justify-center')}>
                    {isRail ? (
                      <Tooltip label={item.label} placement="right" className="justify-center">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/*
        Kullanıcı bloğu DİPNARtILIR: kaydırılsa bile erişilebilirliğini
        kaybetmez. `mt-auto` ile alta sabitlenir.

        Ray modunda yalnız avatar kalır. Ad ve rol etiketleri DOM'dan
        GİZLENMEZ, `sr-only` ile korunur — kullanıcı adı, bir avatar
        resminden daha anlamlı bir erişilebilir bilgidir.
      */}
      <div className="shrink-0 border-t border-on-dark-line p-3">
        {isRail ? (
          <div className="flex justify-center">
            <Tooltip label={`${displayName} · ${roleLabel}`} placement="right">
              <span className="flex">
                <Avatar name={displayName} size="md" />
              </span>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar name={displayName} size="md" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label font-medium text-on-dark-strong">
                {displayName}
              </span>
              <span className="truncate text-caption text-on-dark-muted">{roleLabel}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Oturumu kapat"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-on-dark-muted transition-colors duration-fast hover:bg-on-dark-hover hover:text-on-dark-strong lg:size-9"
            >
              <LogOutIcon className="size-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
