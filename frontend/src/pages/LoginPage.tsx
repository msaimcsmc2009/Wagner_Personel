import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { EyeIcon, EyeOffIcon } from '../components/icons/UiIcons';
import { useAuth } from '../contexts/AuthContext';

/**
 * Giriş ekranı — layout.md §12 (kimlik ekranı), forms.md, brand.md.
 *
 * ⚠ BU EKRAN ÜRÜNÜN İLK TEMASIDIR. Uygulamanın geri kalanı tablolar ve
 *   rakamlardan oluşur; burada o dil henüz yok. Bu yüzden ekran üç işi
 *   birlikte yapar:
 *
 *   1. **Marka.** Koyu lacivert panel (#0C1832) üzerinde beyaz işaret ve
 *      ürün adı. Uygulamadaki tek büyük lacivert yüzey kenar çubuğudur;
 *      girişte aynı işaret ve aynı renk kullanılır, böylece "başka bir
 *      site" değil, "aynı ürün" hissi oluşur.
 *
 *   2. **Bağlam.** Üç satır, uygulamanın GERÇEK kapsamını söyler. Bunlar
 *      sahte istatistik değildir; `navigation.tsx` ve `App.tsx` ile aynı
 *      gerçeğin özetidir. Kullanıcı girişten önce içeride ne olduğunu
 *      bilmelidir.
 *
 *   3. **Form.** Düz bir kart değil; etiketli alanlar, şifre göster/gizle,
 *      gerçek `Alert` hata kutusu ve tek birincil eylem.
 *
 * RESPONSIVE: `lg` altında iki kolon tek kolona iner ve koyu panel tamamen
 * gizlenir; yerine formun üstünde tek satırlık bir marka kilidi gelir.
 * Mobilde iki kolonlu bir giriş ekranı, dikey kaydırma zorunluluğu ve
 * küçük ekranlarda sıkışık form demektir.
 *
 * ⚠ `from` DÖNÜŞÜ KORUNUR. Kullanıcı bir yetki ekranına ya da dashboard'a
 *   bağlantıyla gelip giriş yaparsa, `signIn` sonrası O adrese döner.
 *   Bu davranış `ProtectedRoute`'ın yönlendirdiği `location.state.from`
 *   ile gelir ve kaldırılamaz.
 */
export function LoginPage() {
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /*
    `useLocation().state` tipli değildir: rota durumu çalışma zamanında
    gelen bir nesnedir ve içindeki `from` alanı isteğe bağlıdır. Bu
    yüzden `any` ile okumak yerine dar bir tip ve korumalı erişim
    kullanılır — `state?.from?.pathname` her zaman string değildir.
  */
  const from =
    typeof (location.state as { from?: { pathname?: unknown } } | null)?.from?.pathname ===
      'string'
      ? ((location.state as { from: { pathname: string } }).from.pathname)
      : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (cause: unknown) {
      /*
        Ham hata metni arayüze SÜRÜLMEZ. Supabase'in mesajı İngilizce ve
        teknik olabilir ("Invalid login credentials"); kullanıcıya ne
        yapacağını söyleyen Türkçe bir cümle verilir, gerçek neden
        konsola yazılır.
      */
      console.error('Giriş başarısız:', cause);
      setError('Giriş yapılamadı. E-posta ve şifrenizi kontrol edip tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /*
      `lg:grid-cols-2`: sol kolon sabit, sağ kolon esner. Marka paneli
      `min-h-dvh` DEĞİL, `lg` altında tamamen gizlendiği için taşma
      yaratmaz.
    */
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ----------------------------------------------------------------
          MARKA PANELİ — yalnız `lg` ve üzeri
          ---------------------------------------------------------------- */}
      <div className="wk-on-dark brand-panel-wash relative hidden overflow-hidden bg-brand-dark lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/*
          ⚠ BÜYÜK MARKA ALANI.

          Eski `WK` kutusu + "Wagner Kablo / Personel Yönetim" yazısı
          KALDIRILDI. Yerine gerçek kurumsal logo geldi: `01-wagnerlogo.png`.

          Neden bu dosya lacivert zeminde durabilir: görüntünün görünür
          pikselleri BEYAZ (RGB 255,255,255), arka planı şeffaftır. Beyaz
          çizim açık yüzeyde görünmez; koyu zeminde okunur. Dosya
          `frontend/public/` altındadır ve `/01-wagnerlogo.png` adresinden
          sunulur.

          ÖLÇEK: `w-72` = 288px. Kaynak 620px geniş olduğu için bu bir
          KÜÇÜLTME'dir — küçültme her zaman keskindir, büyütme değil.
          620px'in üzerine çıkılırsa pikseller büyütülmüş (bulanık) olurdu;
          bu yüzden logo hiçbir ekranda kaynak genişliğini aşmayacak
          şekilde boyutlandırılır. `width`/`height` öznitelikleri oranı
          tarayıcıya bildirir, `object-contain` ise oranı korur: logo hiçbir
          ekranda EĞİLMEZ ve gerilmez.
        */}
        <img
          src="/01-wagnerlogo.png"
          alt="Wagner Kablo Personel Yönetim"
          width={620}
          height={400}
          className="h-auto w-72 max-w-full object-contain object-left"
        />

        <div className="flex max-w-100 flex-col gap-6">
          {/*
            Başlık `display` ölçeğindedir ama ürün içinde `h1` YALNIZCA
            form başlığıdır: her ekranda tek `h1` kuralı burada da geçerli
            olmalıdır. Bu yüzden bu metin `h2`'dir.
          */}
          <h2 className="text-display font-semibold tracking-tight text-on-dark-strong">
            Personel sayıları,
            <br />
            tek yerde.
          </h2>

          {/*
            Kapsam cümleleri GERÇEKTİR, pazarlama süsü değildir: uygulama
            yalnız iki toplam saklar ve her değişiklik geçmişe yazılır.
            Sahte bir "1.234 kayıt" ya da "7 yıllık veri" cümlesi, ekranı
            gördüğünde kullanıcının güvenini bozduğu için kullanılmaz.
          */}
          <ul className="flex flex-col gap-3">
            <ScopeLine>Üretim ve Endirekt toplamları, anlık olarak güncel</ScopeLine>
            <ScopeLine>Her değişiklik geçmişe kaydedilir, silinmez</ScopeLine>
            <ScopeLine>Sayı güncelleme yetkisi yöneticilerdedir</ScopeLine>
          </ul>
        </div>

        <p className="text-caption text-on-dark-muted">
          Wagner Kablo Personel Yönetim · Antalya Serbest Bölge
        </p>
      </div>

      {/* ----------------------------------------------------------------
          FORM SÜTUNU
          ---------------------------------------------------------------- */}
      <div className="canvas-wash flex flex-col justify-center bg-background px-4 py-10 sm:px-6 lg:px-10">
        <div className="animate-rise-in mx-auto flex w-full max-w-100 flex-col gap-8">
          {/*
            ⚠ MOBİL MARKA.

            `lg` altında koyu panel yoktur ve logo beyaz olduğu için açık
            zeminde GÖRÜNMEZ. Bu yüzden mobilde logo, form kartının ÜSTÜNDE,
            lacivert bir plaka içinde durur: aynı marka, aynı zemin
            ilişkisi, yalnız küçük ölçekte.

            Plaka dekoratiftir (`aria-hidden` çünkü erişilebilir adı zaten
            `alt` ile taşıyor) ve dokunmayı engellemez.
          */}
          <div
            aria-hidden="true"
            className="flex items-center justify-center rounded-xl bg-brand-dark px-6 py-5 lg:hidden"
          >
            <img
              src="/01-wagnerlogo.png"
              alt=""
              width={620}
              height={400}
              // Mobilde 208px: kaynağın üçte birinden azı, yani keskin.
              className="h-auto w-52 max-w-full object-contain"
            />
          </div>

          <Card className="flex flex-col gap-6 p-5 sm:p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-h2 text-content-primary">Giriş yap</h1>
              <p className="text-body text-content-muted">
                Personel sayılarını görmek ve güncellemek için hesabınıza giriş yapın.
              </p>
            </div>

            {/*
              Hata `Alert` İLE gösterilir, çıplak bir `<p>` ile değil:
              `LoginPage` bu bileşeni kullanmazsa diğer tüm ekranlardaki
              hata görünümüyle arada biçim farkı oluşur. `role="alert"`i
              `Alert` kendisi taşır.
            */}
            {error !== null && (
              <Alert tone="danger" title="Giriş yapılamadı">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <TextField
                fieldId="email"
                type="email"
                label="E-posta"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                autoComplete="email"
                required
              />

              <TextField
                fieldId="password"
                // `type` durumla değişir; `Field` değeri `type` alanını
                // doğrudan geçirdiği için ek bir bileşen gerekmez.
                type={showPassword ? 'text' : 'password'}
                label="Şifre"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
                autoComplete="current-password"
                required
                endAdornment={
                  /*
                    ⚠ `IconButton` `type="button"` ile basılır ve forma
                    gönderim yapmaz. İki durumlu olduğu için `pressed`
                    verilir; erişilebilir ad o DURUMU anlatacak şekilde
                    yazılır ("Şifreyi göster" ↔ "Şifreyi gizle"), çünkü
                    ikon tek başına o anki durumu değil geçişi anlatır.

                    `touchTarget={false}`: düğme 40px'lik girdinin sağına
                    oturur; mobilde 44px'e büyütülürse alanın dışına taşar.
                  */
                  <IconButton
                    label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    pressed={showPassword}
                    touchTarget={false}
                    onClick={() => {
                      setShowPassword((previous) => !previous);
                    }}
                    icon={
                      showPassword ? (
                        <EyeOffIcon className="size-5" />
                      ) : (
                        <EyeIcon className="size-5" />
                      )
                    }
                  />
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting || loading}
                loadingText="Giriş yapılıyor"
                disabled={!email || !password}
                className="mt-2 w-full"
              >
                Giriş Yap
              </Button>
            </form>
          </Card>

          <p className="text-caption text-content-muted">
            Erişim yetkisi yöneticiniz tarafından verilir. Sorun yaşıyorsanız{' '}
            <a href="mailto:destek@wagner.com.tr" className="text-link hover:underline">
              destek ekibiyle
            </a>{' '}
            iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Kapsam satırı — koyu panelde tek cümlelik gerçek.
 *
 * Metnin yanındaki işaret `on-dark-muted` alfasıyla çizilir ve `sr-only`
 * olarak "içerir" bilgisini taşır; yalnız dekoratif nokta bırakılmaz.
 */
function ScopeLine({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-3 text-body text-on-dark">
      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-on-dark-muted" />
      <span>
        <span className="sr-only">İçerir: </span>
        {children}
      </span>
    </li>
  );
}