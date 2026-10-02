import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../layout/PageHeader';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { UsersIcon } from '../icons/UiIcons';

/**
 * Kimlik doğrulama ve yetki kapısı — `App.tsx` rota ağacının kökünde.
 *
 * İKİ AYRI KURAL:
 *
 *   `requireAdmin` YOK → oturum açmamışsa `/login`'e gidilir. `location`
 *   state ile taşınır ki giriş sonrası kullanıcı NEREDEN GELDİĞİNE dönsün.
 *
 *   `requireAdmin` VAR → yetkisiz kullanıcı **SESSİZCE dashboard'a
 *   yönlendirilmez.** Daha önce `Navigate` ile yapılıyordu ve ekranda şu
 *   oluyordu: menüye tıkla → anında dashboard → kullanıcı "bağlantı bozuk"
 *   sanıyor, gerçek sebebi (yetkisi olmadığı) görmüyor, tekrar deniyor ve
 *   aynı sonucu alıyor. Sessiz yönlendirme hatayı gizler.
 *
 *   Bunun yerine kapsayıcı kabuk (kenar çubuğu + üst çubuk) korunur ve
 *   `EmptyState kind="no-permission"` gösterilir: components.md'e göre
 *   yetkisizlik ayrı bir boş durum türüdür ve kendi metnini ister.
 *
 * ⚠ Bu ekran menüdeki karşılığı OLMAYAN bir güvenlik ağıdır: menüde
 *   `requiresAdmin` olan girdiler zaten gizlenir (`navigation.tsx`). Buraya
 *   yalnızca adres çubuğuna doğrudan yazılan bağlantılardan gelinir.
 */
export function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-body text-content-muted">Yükleniyor…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex flex-col gap-6 lg:gap-8">
        <PageHeader
          title="Erişim yok"
          crumbs={[{ label: 'Ana Sayfa' }, { label: 'Erişim yok' }]}
        />

        <Card padding="none">
          <EmptyState
            kind="no-permission"
            icon={<UsersIcon className="size-12" />}
            title="Bu sayfayı görme yetkiniz yok"
            body="Bu sayfa yalnızca yöneticiler içindir. Erişim gerekiyorsa yöneticinizden talep edebilirsiniz."
            actions={
              <Button variant="secondary" onClick={() => { navigate('/', { replace: true }); }}>
                Dashboard'a Dön
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return <Outlet />;
}