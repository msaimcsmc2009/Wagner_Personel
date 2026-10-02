import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Skeleton, SkeletonRegion } from '../components/ui/Skeleton';
import { TextField } from '../components/ui/Field';
import { BuildingIcon, CheckIcon, UsersIcon } from '../components/icons/UiIcons';
import { formatDateTime, formatNumber } from '../lib/format';
import { useDelayedFlag } from '../lib/useDelayedFlag';
import { useAuth } from '../contexts/AuthContext';
import { updateStaffCount, fetchStaffCounts } from '../services/staffCountService';
import { ApiError } from '../services/apiClient';
import { MAX_HEADCOUNT, STAFF_CATEGORIES, type StaffCategory } from '../types/staffCount';

/**
 * Personel sayılarını güncelleme ekranı — forms.md.
 *
 * Bu ekran yalnızca İKİ sayı gösterir/girilir: Üretim ve Endirekt.
 *
 * ⚠ OKUMA HERKESE, YAZMA YÖNETİCİYE AÇIK.
 *   Backend sözleşmesi bu ayrımı zaten uygular: `GET /staff-counts` her
 *   giriş yapmış kullanıcıya, `PATCH /staff-counts` yalnızca yöneticilere
 *   açıktır. Ekran da aynısını yapar: yönetici olmayan kullanıcı güncel
 *   sayıları GÖRÜR, alanlara dokunamaz ve kaydedemez.
 *
 *   Daha önce ekran "Erişim kısıtı henüz yok" uyarısı basıyordu; bu, kimlik
 *   doğrulama eklendikten sonra YALAN SÖYLEMEYE başlayan bir metindi.
 *
 * ⚠ Yönetici olmayan kullanıcıda alanlar `disabled` DEĞİLDİR, salt
 *   okunur (readOnly) yapılır. `disabled` alanlar formdan tamamen düşer ve
 *   odak sırasına girmez; kullanıcı sayıları görmek için tıklamaya çalışır
 *   ve hiçbir şey olmaz. `readOnly` alan odaklanabilir, seçilebilir ve
 *   kopyalanabilir — bir sayıyı panoya almak yönetici olmayan kullanıcının
 *   da meşru işidir.
 *
 * ⚠ TOPLAM ALANI YOKTUR ve kullanıcıdan istenmez. Toplam iki sayının
 *   toplamıdır; elle girilen bir toplam bu iki sayıyla çelişebilir ve
 *   tutarsız veri üretir. Burada yalnızca HESAPLANAN bir önizleme gösterilir.
 *
 * ⚠ Bu ekranda "Personel Ekle", "Düzenle", "Sil" gibi tek kişi işlemleri
 *   YOKTUR ve bulunmayacaktır. Personel kaydı tutulmaz; burada yalnızca toplam
 *   sayılar güncellenir.
 *
 * Doğrulama her tuşta DEĞİL, blur ve gönderim anında çalışır. Kullanıcı
 * yazarken kırmızı bir hata görmek, henüz bitirmemiş bir alanı cezalandırmak
 * anlamına gelir.
 */

const CATEGORY_ICON: Record<StaffCategory, typeof UsersIcon> = {
  Üretim: BuildingIcon,
  Endirekt: UsersIcon,
};

/**
 * Kategori tanıtım metni.
 *
 * İpucu, düzenlenebilir alanın NE olduğunu söyler. Etiket zaten görünür
 * olduğu için ipucu tekrar etmez; biçim örneği ve son güncelleme zamanını
 * verir.
 */
function buildHint(category: StaffCategory, updatedAt: string | null): string {
  const base = category === 'Üretim' ? 'Üretim bölümünde çalışan kişi sayısı' : 'Endirekt (destek) bölümünde çalışan kişi sayısı';

  if (updatedAt === null) {
    return `${base}. Örnek: ${category === 'Üretim' ? '40' : '60'}`;
  }

  return `${base} · Son güncelleme ${formatDateTime(updatedAt)}`;
}

/**
 * Tek bir sayı alanını doğrular.
 *
 * Mesajlar hem spesifik hem eyleme dönüktür: "geçersiz" değil, "tam sayı
 * olmalı" / "negatif olamaz". `null` dönerse alan geçerlidir.
 */
function validate(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed === '') {
    return 'Personel sayısı girilmedi. Değiştirmek istemiyorsanız 0 yazın.';
  }

  const numeric = Number(trimmed);

  if (!Number.isFinite(numeric)) {
    return 'Personel sayısı bir sayı olmalı. Örnek: 40';
  }

  if (!Number.isInteger(numeric)) {
    return 'Personel sayısı tam sayı olmalı. Ondalıklı değer girilemez.';
  }

  if (numeric < 0) {
    return 'Personel sayısı negatif olamaz.';
  }

  if (numeric > MAX_HEADCOUNT) {
    return `Personel sayısı ${formatNumber(MAX_HEADCOUNT)} değerini aşamaz.`;
  }

  return null;
}

/** Tüm alanların doğrulamasını tek seferde çalıştırır (gönderimde). */
function validateAll(values: Record<StaffCategory, string>): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {};

  for (const category of STAFF_CATEGORIES) {
    const error = validate(values[category]);
    if (error !== null) {
      errors[category] = error;
    }
  }

  return errors;
}

export function StaffCountsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [values, setValues] = useState<Record<StaffCategory, string>>({
    Üretim: '',
    Endirekt: '',
  });
  const [savedValues, setSavedValues] = useState<Record<StaffCategory, string>>({
    Üretim: '',
    Endirekt: '',
  });
  const [errors, setErrors] = useState<Partial<Record<StaffCategory, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<StaffCategory, boolean>>>({});

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Partial<Record<StaffCategory, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  /** Odak, ilk hatalı alana taşınmak için kullanılır. */
  const firstErrorRef = useRef<StaffCategory | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchStaffCounts(controller.signal)
      .then((response) => {
        const next: Record<StaffCategory, string> = { Üretim: '0', Endirekt: '0' };
        const times: Partial<Record<StaffCategory, string>> = {};

        for (const item of response.categories) {
          next[item.category] = String(item.headcount);
          // Repository, hiç güncellenmemiş kategoriler için epoch döndürür
          // (`1970-…`); bu bir "son güncelleme" değildir ve ipucunda
          // gösterilmemelidir.
          if (!item.updatedAt.startsWith('1970-')) {
            times[item.category] = item.updatedAt;
          }
        }

        setValues(next);
        setUpdatedAt(times);
        // Formu yalnız kullanıcı değiştirdiğinde kirletmek için karşılaştırma
        // tabanı ayrı tutulur.
        setSavedValues(next);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  const showSkeleton = useDelayedFlag(loading);

  /**
   * Önizleme toplamı — formdaki İKİ değerin toplamı.
   *
   * Alanlardan biri geçersizse toplam `null` olur ve alan "—" gösterilir;
   * kısmen geçersiz bir formun toplamını göstermek yanıltıcıdır.
   */
  const previewTotal = useMemo(() => {
    let sum = 0;

    for (const category of STAFF_CATEGORIES) {
      const numeric = Number(values[category].trim());

      if (!Number.isInteger(numeric) || numeric < 0 || numeric > MAX_HEADCOUNT) {
        return null;
      }

      sum += numeric;
    }

    return sum;
  }, [values]);

  /** Değişiklik var mı? Kaydet düğmesi yalnız değişiklik varken etkin olur. */
  const isDirty = useMemo(
    () => STAFF_CATEGORIES.some((category) => values[category].trim() !== savedValues[category].trim()),
    [values, savedValues],
  );

  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = useCallback(
    (category: StaffCategory, next: string) => {
      setValues((previous) => ({ ...previous, [category]: next }));
      // Kullanıcı düzeltmeye başladığında önceki hata mesajı ekranda
      // kalıcı kalmasın; yeniden hesaplanır.
      setSaved(null);
      setSubmitError(null);
    },
    [],
  );

  /**
   * Gönderim yalnızca yönetici için anlamlıdır.
   *
   * Backend `PATCH` ucunu `requireAdmin` ile koruyor; bu ekran da aynı
   * kontrolü yapar. Böylece yetkisiz kullanıcı 403 aldığında "yetkiniz yok"
   * yerine, hiç gönderim yapmadan gerekçeyi ekranda görür.
   */
  const canEdit = isAdmin;

  /**
   * Blur'da doğrulama.
   *
   * Alan YALNIZCA dokunulduğunda doğrulanır; `touched` sayesinde sayfa ilk
   * açıldığında henüz dokunulmamış alanlar kırmızı görünmez.
   */
  const handleBlur = useCallback((category: StaffCategory) => {
    setTouched((previous) => ({ ...previous, [category]: true }));

    setErrors((previous) => {
      const error = validate(values[category]);
      const next = { ...previous };

      if (error === null) {
        delete next[category];
      } else {
        next[category] = error;
      }

      return next;
    });
  }, [values]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (submitting || !canEdit) return;

      setSubmitError(null);
      setSaved(null);

      const allErrors = validateAll(values);
      setErrors(allErrors);
      setTouched({ Üretim: true, Endirekt: true });

      const invalidCategory = STAFF_CATEGORIES.find((category) => allErrors[category] !== undefined);

      if (invalidCategory !== undefined) {
        // Hatalı alana odak taşınır: kullanıcı hatayı aramak zorunda kalmaz.
        firstErrorRef.current = invalidCategory;
        document.getElementById(`headcount-${invalidCategory}`)?.focus();
        return;
      }

      setSubmitting(true);

      try {
        // İki kategori SIRAYLA gönderilir. Her biri kendi geçmiş kaydını
        // ayrı ayrı oluşturur; backend her çağrıda toplamı yeniden okur.
        for (const category of STAFF_CATEGORIES) {
          await updateStaffCount(category, values[category].trim());
        }

        setSavedValues(values);
        setSaved('Sayılar kaydedildi. Önceki değerler geçmişte korunuyor.');
      } catch (error: unknown) {
        setSubmitError(
          error instanceof ApiError
            ? error.message
            : 'Sayılar kaydedilemedi. Lütfen tekrar deneyin.',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [values, submitting, canEdit],
  );

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title="Personel Sayıları"
        accent="Güncelle"
        meta="Üretim ve Endirekt için toplam personel sayısını girin. Toplam otomatik hesaplanır."
        crumbs={[{ label: 'Ana Sayfa' }, { label: 'Personel Sayıları' }]}
        actions={
          <Button variant="secondary" onClick={() => { navigate('/'); }}>
            Dashboard'a Dön
          </Button>
        }
      />

      {/*
        ⚠ Yönetici olmayan kullanıcı için tek ve net uyarı.

        Sesli bir "erişim kısıtı yok" duyurusu değil, yetkinin ne olduğu:
        sayıları görebilir, değiştiremez. Kapatılamaz — kullanıcı bu bilgiyi
        kaçırdığında neden kaydedemediğini anlamaz.
      */}
      {!canEdit && (
        <Alert tone="info" title="Değiştirme yetkiniz yok">
          Güncel sayıları görebilirsiniz; değerleri yalnızca yöneticiler
          güncelleyebilir.
        </Alert>
      )}

      {saved !== null && (
        <Alert tone="success" title="Kaydedildi" onDismiss={() => { setSaved(null); }}>
          {saved}
        </Alert>
      )}

      {submitError !== null && (
        <Alert
          tone="danger"
          title="Kaydedilemedi"
          onDismiss={() => { setSubmitError(null); }}
        >
          {submitError}
        </Alert>
      )}

      {loadError !== null && (
        <Alert
          tone="danger"
          title="Mevcut değerler okunamadı"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                window.location.reload();
              }}
            >
              Tekrar Dene
            </Button>
          }
        >
          {loadError} Yine de değer girebilirsiniz; kayıt sırasında kontrol edilecektir.
        </Alert>
      )}

      {/*
        ⚠ `max-w-180` = 720px. `layout.md §5`: form öncelikli ekranlar
        720px ile SINIRLANIR. 800px'lik bir formda ilk alandan gönder
        düğmesine uzunluk 2000px'e yaklaşır ve göz yorar. Eski değer
        (`max-w-200`, 800px) bu sınırın iki adım üstündeydi.
      */}
      <Card padding="none" className="max-w-180">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 p-4 sm:p-5">
          <CardHeader
          title="Güncel sayılar"
          description={
            canEdit
              ? 'Değiştirmek istemediğiniz alanı olduğu gibi bırakın.'
              : 'Değerleri görmek için alanlara tıklayıp seçebilirsiniz.'
          }
        />

          {showSkeleton ? (
            <SkeletonRegion label="Mevcut sayılar yükleniyor">
              <div className="flex flex-col gap-5">
                {[0, 1].map((index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                ))}
              </div>
            </SkeletonRegion>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {STAFF_CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICON[category];
                  const error = touched[category] === true ? errors[category] : undefined;

                  return (
                    <div key={category} className="flex flex-1 flex-col">
                      {/*
                        Kategori ikonu ETİKETİN YANINDA, salt dekoratif olarak
                        gösterilir. Alanın görünür etiketi zaten `TextField`
                        tarafından basılır; burada yalnız görsel bağlam eklenir.
                      */}
                      <span
                        aria-hidden="true"
                        className="mb-2 flex size-9 items-center justify-center rounded-md bg-brand-soft text-content-brand"
                      >
                        <Icon className="size-5" />
                      </span>

                      <TextField
                        // `id` alan adına göre kurulur ki hata durumunda odak
                        // doğrudan alana gidebilsin.
                        fieldId={`headcount-${category}`}
                        label={category}
                        hint={buildHint(category, updatedAt[category] ?? null)}
                        error={error}
                        required={canEdit}
                        type="number"
                        inputMode="numeric"
                        step={1}
                        min={0}
                        max={MAX_HEADCOUNT}
                        value={values[category]}
                        // Alanlar yönetici olmayan kullanıcıda `disabled`
                        // DEĞİL `readOnly` olur: sayı odaklanabilir ve
                        // kopyalanabilir kalır, yazılamaz.
                        readOnly={!canEdit}
                        aria-readonly={!canEdit}
                        disabled={submitting}
                        onChange={(event) => {
                          handleChange(category, event.target.value);
                        }}
                        onBlur={() => {
                          handleBlur(category);
                        }}
                        className="flex-1"
                      />
                    </div>
                  );
                })}
              </div>

              {/*
                TOPLAM — okunur, DÜZENLENEMEZ.
                `aria-live="polite"` ile değişiklik duyurulur: kullanıcı 40 ve 60
                yazdığında toplamın 100'e çıktığını duyabilir.
              */}
              <div
                aria-live="polite"
                className="flex items-baseline justify-between gap-3 rounded-lg bg-surface-sunken px-4 py-3"
              >
                <span className="text-body font-medium text-content-secondary">
                  Toplam (Üretim + Endirekt)
                </span>
                <span className="text-h2 font-semibold text-content-primary tabular-nums">
                  {previewTotal === null ? '—' : formatNumber(previewTotal)}
                </span>
              </div>

              <p className="text-caption text-content-muted">
                Toplam kaydedilmez; iki sayının toplamı olarak hesaplanır.
                {canEdit
                  ? ' Kaydettiğinizde önceki değer geçmişte korunur.'
                  : ' Geçmişe kayıt eklemek için değer değiştirme yetkisi gerekir.'}
              </p>

              {/*
                Birincil eylem tek ve EN SAĞDA. `hasErrors` durumunda düğme
                kilitlenmez: kullanıcı eksik alanı doldurup tekrar gönderebilir
                ve odak ilk hatalı alana taşınır.

                RESPONSIVE: mobilde düğmeler TAM GENİŞLİKTEDİR. İki yan yana
                dar düğme, 44px dokunma hedefi olsalar bile niş etme
                isabetini zorlaştırır ve "Geri Al" ile "Kaydet" birbirine
                karışır. Dikey dizilimde birincil eylem ÜSTTE gelir
                (`flex-col-reverse`): kaydetmek asıl amaçtır, iptal yardımcıdır.

                ⚠ Yönetici olmayan kullanıcıya GÖNDERİM DÜĞMELERİ
                  GÖSTERİLMEZ. Devre dışı bir "Kaydet" düğmesi, tıklanabilir
                  görünüp hiçbir şey yapmayan bir vaattir; gerekçe zaten
                  yukarıdaki bilgi bandında yazılıdır.
              */}
              {canEdit && (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {/*
                    ⚠ "Geri Al" YARDIMCI eylemdir ve `ghost` varyantıyla
                    verilir. `secondary` olsaydı göz iki eşit ağırlıklı yüzey
                    görürdü ve "hangi birincil?" sorusu doğardı. Sayfada tek
                    birincil eylem kuralı (AGENTS.md) burada da geçerlidir.
                  */}
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto"
                    disabled={submitting || !isDirty}
                    onClick={() => {
                      setValues(savedValues);
                      setErrors({});
                      setTouched({});
                      setSubmitError(null);
                      setSaved(null);
                    }}
                  >
                    Geri Al
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:w-auto"
                    loading={submitting}
                    loadingText="Kaydediliyor"
                    disabled={!isDirty || hasErrors}
                    iconStart={<CheckIcon className="size-4" />}
                  >
                    Kaydet
                  </Button>
                </div>
              )}
            </>
          )}
        </form>
      </Card>
    </div>
  );
}
