import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { StaffCountsPage } from './pages/StaffCountsPage';
import { ServiceStatusPage } from './pages/ServiceStatusPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

/**
 * Ürün yönlendirmeleri — `config/navigation.tsx` ile aynı rotaları paylaşır.
 *
 * ⚠ KAPSAM: bu uygulamada personel KAYDI tutulmaz, bu yüzden `/personel`,
 * `/departmanlar`, `/izinler` ve `/egitim` rotaları KALDIRILDI ve
 * bilinçli olarak geri getirilmeyecektir. Varlığı olan tek veri, "Üretim" ve
 * "Endirekt" için toplam personel SAYISIDIR.
 *
 * `/gecmis` geçmiş kayıtlarının kendi ekranıdır. Dashboard'dan ayrı tutulur:
 * güncel durumla geçmiş aynı sayfada birlikte gösterildiğinde dashboard
 * iki farklı soruya aynı anda yanıt vermeye çalışır ve ikisi de
 * yarım okunur.
 *
 * `/raporlar` KALDIRILDI: hesaplanabilir bir rapor veri modeli yok. Boş bir
 * rapor ekranına yönlendiren bir menü girdisi, vaat edilen işlevi yerine
 * getiremeyen bir yoldur.
 *
 * ⚠ `/ayarlar` KALDIRILDI. Route, `SettingsPage`, menü girdisi, `SİSTEM`
 *   bölümü ve breadcrumb etiketi birlikte silindi. Ekran bir `EmptyState`
 *   stub'ıydı; ayar tutan, saklayan veya okuyan hiçbir şey yoktu.
 *   Silinen bileşenlerin dependency'si kontrol edildi: `SettingsPage`
 *   yalnız bu route'ta, `ProfilePage` ve `UserManagementPage` ise HİÇ
 *  bir yerde import edilmiyordu. Backend'de `/ayarlar` ile ilgili uc,
 *   tablo veya migration YOKTUR; bu yüzden sunucu tarafında bir şey
 *   değişmedi.
 *
 * ⚠ YETKİ: `PersonelSayıları` rotası `requireAdmin` DEĞİLDİR.
 *   Backend sözleşmesi `GET /staff-counts` ucunu HER GİRİŞ YAPMIŞ kullanıcıya,
 *   `PATCH` ucunu yalnızca yöneticilere açar. Rota da aynı ayrımı izler:
 *   sayıları görmek herkese açıktır, DEĞER DEĞİŞTİRMEK yöneticiye
 *   aittir ve bu ayrım ekranın içinde `StaffCountsPage` tarafından
 *   uygulanır. Rotayı `requireAdmin` yapmak, API'den daha kısıtlı bir
 *   sözleşme uydurur ve güncel sayıları görmesi gereken kullanıcıları
 *   gereksiz yere engellerdi.
 *
 * `/durum` geliştirici sağlık ekranıdır ve kenar çubuğunda yer almaz;
 * yalnızca adres çubuğundan açılır. Bu BİLİNÇLİDİR: sağlık ekranı her
 * kullanıcının günlük menüsünde durmamalıdır, ama bir destek talebinde
 * yöneticinin adresi bilmesi gerekir.
 */
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="gecmis" element={<HistoryPage />} />
          <Route path="personel-sayilari" element={<StaffCountsPage />} />
          <Route path="durum" element={<ServiceStatusPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
