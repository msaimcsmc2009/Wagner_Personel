import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';
import { userDisplayName, userRoleLabel } from '../../lib/user';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { LogOutIcon, MenuIcon } from '../icons/UiIcons';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Üst çubuk — layout.md §3.
 *
 * Yükseklik 64px, beyaz, alt kenarlık. Sıra: hamburger (yalnızca mobil) ·
 * boşluk · kullanıcı menüsü.
 *
 * Genel arama alanı YOKTUR: bu uygulamada aranacak bir veri bulunmuyor
 * (yalnızca iki toplam sayı saklanır).
 *
 * Bildirim ve yardım düğmeleri KALDIRILDI. İkisi de çalışmayan birer
 * vaatti: uygulamada bildirim üreten bir olay, kullanıcıya ulaştırılacak
 * bir mesaj ve yardım edilecek bir belge YOKTUR. Boş bir zil ve boş bir
 * soru işareti, tıklandığında hiçbir şey olmayan iki kontrol edilebilir
 * yüzeydir. Bu, `EmptyState` yerine geçmez — kullanıcıya hiçbir bilgi
 * vermeyen bir yüzey, hiç yüzey bulunmamasından daha kötüdür.
 *
 * Bu karar geri alınabilir: bildirim üreten bir özellik (izin onayı,
 * geçmiş kaydı) eklenirse zil o zaman anlamlı olur. Yardım düğmesi için
 * geçerli olan şey gerçek bir yardım belgesi veya destek kanalıdır.
 *
 * Breadcrumb üst çubuğun **içinde değil**, altında ayrı bir satırdır: iki
 * farklı gezinme düzeyi, iki farklı satır.
 *
 * ⚠ KULLANICI MENÜSÜ YALNIZ İKİ PARÇADAN OLUŞUR:
 *   1. Kim olduğu (ad + rol) — `header` bloğu, eylem DEĞİLDİR
 *   2. Çıkış yap — `Dropdown` öğesi
 *
 *   "Profilim" ve "Ayarlar" girdileri KALDIRILDI. Gerekçe: ikisi de
 *   çalışmayan vaatlerdi. "Profilim" `/ayarlar` adresine gidiyordu (o
 *   rota yok edildi), "Ayarlar" da aynı boş ekrana. Tıklanan bir menü
 *   öğesinin HİÇBİR şey yapmaması, olmayan bir özelliği vaat etmekten
 *   daha kötüdür: kullanıcı ne yapmadığını anlamaz, yalnız "bozuk" der.
 *
 *   Kullanıcı hesabına ait zorunlu bilgiler (ad, e-posta, rol) ve oturum
 *   kapatma KORUNDU; yalnız kullanılmayan gezinme seçenekleri gitti.
 *   `signOut` ve `AuthContext` DOKUNULMADI.
 */
export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  /*
    Üst çubuk yalnız ADIN baş harfini gösterir; tam ad kenar çubuğundadır.
    Ad, `AuthContext`'ten gelir: kim giriş yapmışsa ekranda o görünür.
  */
  const displayName = userDisplayName(user);
  const firstName = displayName.split(' ')[0] ?? displayName;

  // 8px'yi aşınca gölge kazanır. `sticky` CSS'te; bu yalnızca gölge için JS.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-sticky flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4',
        'transition-shadow duration-base sm:px-6',
        scrolled && 'shadow-subtle',
      )}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Menüyü aç"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-content-secondary transition-colors duration-fast hover:bg-surface-sunken lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>

      {/*
        Genel arama alanı KALDIRILDI.

        Uygulama yalnızca iki toplam sayı gösterir (Üretim / Endirekt).
        Personel kaydı tutulmadığı için ad, sicil veya birim adına göre
        aranacak bir veri yoktur. Boş bir arama çubuğu bir işlev
        vaadeder; arama kutusu olmaması bu vaadi yerine getirmemekten
        daha dürüst bir davranıştır. Personel listesi geri gelirse arama
        da geri gelmelidir.
      */}

      <div className="ml-auto flex items-center gap-1">
        {/*
          Sağ tarafta yalnızca kullanıcı menüsü kalır.

          Dokunma hedefleri: mobilde 44px, farede 40px
          (`max-md:size-11` tetikleyicide). responsive.md §4: "Icon buttons:
          40px desktop, 44px on touch."
        */}

        <Dropdown
          label="Kullanıcı menüsü"
          align="end"
          className="ml-1"
          header={
            /*
              Kimlik bloğu. `Dropdown` bunu `role="menu"` DIŞINDA basar,
              çünkü bir eylem değildir; ekran okuyucu için düz metindir.

              İKİ SATIR: ad ve rol. E-posta üçüncü satır olarak EKLENMEZ —
              profil alanı kaldırıldığı için e-posta artık hiçbir ekranda
              görünmüyor ve buraya taşımak onu bir menü öğesine dönüştürür.
              Ad + rol, kullanıcının "hangi hesapla giriş yaptım" sorusunu
              yanıtlamak için gereken minimumdur.
            */
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-body font-medium text-content-primary">
                {displayName}
              </span>
              <span className="truncate text-caption text-content-muted">
                {userRoleLabel(user?.role)}
              </span>
            </div>
          }
          items={[
            {
              label: 'Çıkış yap',
              icon: <LogOutIcon className="size-4" />,
              onSelect: async () => {
                /*
                  `signOut` oturumu kapatır ve `AuthContext` giriş yapılmamış
                  duruma geçer; `ProtectedRoute` zaten `/login`'e yönlendirir.
                  Açık `navigate` burada GEREKSİZDİR ve eklendiğinde iki
                  yönlendirme yarışır. `AuthContext` DOKUNULMADI: oturum
                  yönetimi tek yerinde kalır.
                */
                await signOut();
              },
            },
          ]}
        >
          <Avatar name={displayName} size="md" />
          <span className="hidden max-w-32 truncate text-label font-medium text-content-primary sm:inline">
            {firstName}
          </span>
        </Dropdown>
      </div>
    </header>
  );
}
