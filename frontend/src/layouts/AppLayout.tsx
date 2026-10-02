import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../contexts/AuthContext';

/**
 * Uygulama kabuğu — layout.md §1, responsive.md §2.
 *
 * Üç kip:
 *   < 1024px        280px off-canvas drawer (hamburger)
 *   1024 – 1279px   64px ikon rayı
 *   ≥ 1280px        256px kenar çubuğu
 *
 * Genişlik kararı: içerik `max-w-360` (1440px) ile SINIRLANIR, sabitlenmez.
 * 1440px sabit düzen reddedilmiştir — `max-w-*` üst sınıftır, ekran daralınca
 * düzen kendiliğinden daralır.
 *
 * `main` landmark'ı ekran okuyucu gezinmesi için zorunludur ve "İçeriğe geç"
 * bağlantısının hedefidir.
 */
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { profileError } = useAuth();

  // Rota değişince mobil drawer kapansın; aksi halde içeriğin üstünü örter.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  /*
    Drawer açıkken arka plan kaydırması kilitlenir.
    Çünkü arkada kalan içerik kaydırılırsa, drawer sabit kalırken altındaki
    sayfa hareket eder — kullanıcı drawer'ın nereye bağlı olduğunu kaybeder.
  */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  /*
    `Esc` drawer'ı kapatır (responsive.md §2).

    Bu bir konfor değil, bir zorunluluktur: `Esc` kapatma davranışı kullanıcının
    bir modaldan çıkması için öğrendiği reflekstir. Drawer bunu yapmazsa,
    klavyeyle gezinen bir kullanıcı yalnız `Tab` ile menüden çıkabilir ve
    odak perdesinin arkasında kalır.
  */
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-modal focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-label focus:text-content-brand"
      >
        İçeriğe geç
      </a>

      {/*
        Mobil drawer perdesi. Yalnızca `lg` altında anlamlıdır; ekran
        genişletilince kenar çubuğu zaten görünür olduğu için DOM'da kalması
        bir hata olurdu.
      */}
      {menuOpen && (
        <div
          aria-hidden="true"
          onClick={() => {
            setMenuOpen(false);
          }}
          className="fixed inset-0 z-sticky bg-overlay lg:hidden"
        />
      )}

      <div className="flex min-h-dvh">
        {/*
          Masaüstünde kenar çubuğu akışın İÇİNDEDİR (`lg:sticky`), bu yüzden
          içerik sütununda ek bir sol boşluk gerekmez. Mobilde `fixed`
          olduğundan dar olan genişlik akışa katılmaz.
        */}
        <Sidebar
          open={menuOpen}
          onNavigate={() => {
            setMenuOpen(false);
          }}
        />

        <div className="relative flex min-w-0 flex-1 flex-col">
          {/*
            ⚠ TUval yıkaması — zeminin düzlüğünü bozan tek ölçü.

            `#F8FAFC` tek başına ölü bir alandır: sayfadaki tek beyaz yüzey
            (kart) zeminle arasında çok az kontrast verir ve sayfa "mavi +
            beyaz" olarak okunur. Bu katman, sol üstten gelen çok düşük
            opaklıklı marka lacivertini `--color-canvas-accent` ile
            tuvale serer.

            Kurallar:
              - `aria-hidden` + `pointer-events-none`: dekoratiftir, hiçbir
                şeye dokunmaz ve ekran okuyucuya bildirilmez.
              - `z-10` DEĞİL, `-z-10`: konumlandırılmış bir katman, akış
                içeriğinin ÜSTÜNE boyanır. Negatif z-index onu tersine
                çevirir; yıkama tuvalin arkasında kalır ve metnin üzerine
                oturmaz. (Token `-z-base` (`0 × -1`) YETMEZ: sıfır, negatif
                değildir.)
              - Yalnız İÇERİK sütununda: koyu kenar çubuğunun üzerine
                uzanmaz (orada görünmez olurdu).
          */}
          <div
            aria-hidden="true"
            className="canvas-wash pointer-events-none absolute inset-0 -z-10"
          />
          <Topbar
            onOpenMenu={() => {
              setMenuOpen(true);
            }}
          />

          {/*
            İçerik dolgusu responsive.md §1'in sütununa birebir uyar:
            xs 12 → sm 16 → md 20 → lg 24 → xl 32.

            `min-w-0` ZORUNLUDUR: bu sütun bir flex çocuğudur ve varsayılan
            `min-width: auto` ile uzun içerik (bir sayı, bir tarih) şeridi
            şişirir. Şişen şerit, sayfa düzeyinde yatay kaydırma çubuğu
            üretir — responsive.md §7'nin "en sık görülen responsive hatası"
            dediği durum.
          */}
          <main
            id="main-content"
            className="mx-auto w-full max-w-360 flex-1 px-3 py-6 sm:px-4 md:px-5 lg:px-6 lg:py-8 xl:px-8"
          >
            {/*
              Profil/rol okunamadıysa kullanıcı UYARILIR.

              Bu band olmazsa kullanıcı yönetici olduğunu sanar, yönetici
              girdilerini menüde bulamaz ve bunun kendisinin bir hata
              olduğunu düşünür. Asıl sorun (backend'e ulaşılamıyor ya da
              migration eksik) ekranda görünür olmalıdır: kullanıcı bunu
              yöneticisine bildirebilsin.
            */}
            {profileError !== null && (
              <div className="mb-6">
                <Alert tone="warning" title="Kullanıcı bilgileri alınamadı">
                  {profileError} Bu nedenle yönetici özellikleri ve sayı
                  güncelleme kullanılamıyor. Bağlantınızı kontrol edip tekrar
                  deneyin.
                </Alert>
              </div>
            )}

            {/*
              ⚠ SAYFA GİRİŞİ — rota değişince içerik `opacity 0→1` ve
              `translateY 6px→0` ile gelir (240ms).

              Neden `key`: animasyon bir ROTA DEĞİŞİMİNDE yeniden
              başlamalıdır. `key` verilmezse React aynı bileşen ağacını
              günceller, animasyon yeniden tetiklenmez ve ikinci menü
              tıklaması "ölü" hissedilir. `key` o alt ağacı yeniden
              kurar; sayfa zaten rota değişiminde kendiliğinden yeniden
              kurulduğu için ek bir maliyet getirmez.

              Bu sarmalayıcı bir KART DEĞİLDİR: kenarlığı, dolgusu ve
              gölgesi yoktur. Yalnız animasyon taşıyıcısıdır.
            */}
            <div key={location.pathname} className="animate-rise-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
