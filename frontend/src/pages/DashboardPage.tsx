import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton, SkeletonRegion } from '../components/ui/Skeleton';
import { ArchiveIcon, PencilIcon } from '../components/icons/UiIcons';
import { formatDateTime, formatNumber } from '../lib/format';
import { describeError } from '../lib/describeError';
import { useDelayedFlag } from '../lib/useDelayedFlag';
import { fetchStaffCounts } from '../services/staffCountService';
import { type StaffCategory, type StaffCount } from '../types/staffCount';

/**
 * Dashboard — layout.md §9, tables.md, anti-patterns.md.
 *
 * ⚠ KAPSAM — burada personel kaydı YOKTUR. Ad, sicil, e-posta, izin durumu
 * veya vardiya gibi bilgiler tutulmadığı için "aktif personel", "yeni işe
 * giriş", "izinli personel" gibi metrikler ANLAMSIZDIR ve gösterilmez.
 *
 * Sayfa ÜÇ SORUYU yanıtlar ve her biri TEK bir yerde durur:
 *   1. Şu an toplam kaç kişi var?      → HERO (kenar çubuğu olmayan büyük sayı)
 *   2. Bu toplam nasıl bölünüyor?      → Dağılım grafiği
 *   3. Bu sayı ne zaman değişti?       → Hero altındaki meta satırı
 *
 * Üçü de kart içinde kart içinde değil; hero çıplak tuval üzerinde durur,
 * grafik tek bir yüzeyde toplanır. "Her ölçüyü kendi kutusuna koy" refleksi,
 * jenerik yönetici paneli görünümünün birincil nedenidir.
 *
 * ⚠ AYNI SAYI İKİ KEZ YAZILMAZ. Üretim ve Endirekt değerleri yalnızca
 * grafikte görünür; ayrı bir KPI kartı dizisi, hücre listesi veya özet
 * tablosu YOKTUR. Üçünü de tek yerde okumak, "hangisi doğru?" sorusunu
 * ortadan kaldırır.
 *
 * ⚠ GEÇMİŞ BURADA YOKTUR. Geçmiş kayıtları `/gecmis` ekranındadır.
 *
 * YÜKLEME / HATA durumları ele alınmıştır; hata durumunda başlıktaki
 * eylemler KORUNUR.
 */

/**
 * Grafik sütunu.
 *
 * `total` en büyük değerdir (üretim + endirekt), dolayısıyla ölçek
 * `total`'a göre alınır: toplam tam yükseklikte, gruplar kendi payında.
 * Böylece grafik, okuyucunun zihnindeki "toplam iki parçadan oluşur"
 * modelini birebir gösterir.
 */
type ColumnKey = StaffCategory | 'Toplam';

interface Column {
  key: ColumnKey;
  value: number;
  /** Veri işareti. Üretim ve Endirekt `chart` paletinden, Toplam markadan. */
  barClassName: string;
  /** Giriş animasyonunda gecikme — sütunlar peş peşe yükselir. */
  delayMs: number;
}

const COLUMN_STYLE: Record<ColumnKey, { barClassName: string; delayMs: number }> = {
  /*
    Renk seçimi üç kurala dayanır:
      1. Wagner paletinde kalınır — `brand-500`, `brand-300`, `brand-700`.
         Hazır chart şablonu rengi, mor veya turkuaz YOKTUR.
      2. Üç sütun birbirinden AYIRT EDİLEBİLİR olmalı: iki mavi tonu bir
        birinin açık varyantı, ayrı bir nötr ton DEĞİL — bu yüzden Toplam
         en koyu lacivertle ve gruplar açık maviyle ayrışır.
      3. Toplam EN KOYU olur: en uzun çubuk aynı zamanda en ağır olmalı,
         "tümü" bilgisi görsel olarak da baskın olmalıdır.
  */
  Üretim: { barClassName: 'bg-brand-500', delayMs: 0 },
  Endirekt: { barClassName: 'bg-brand-300', delayMs: 60 },
  Toplam: { barClassName: 'bg-brand-700', delayMs: 120 },
};

export function DashboardPage() {
  const navigate = useNavigate();

  const [countsState, setCountsState] = useState<LoadState<{ categories: StaffCount[]; total: number }>>(
    { status: 'loading' },
  );

  useEffect(() => {
    const controller = new AbortController();

    /*
     * ⚠ Bu ekran YALNIZCA güncel durumu okur. Geçmiş kayıtları buraya
     * ÇEKİLMEZ; kendi ekranında yaşarlar. İki isteği birleştirmek kısa bir
     * süre kazandırır ama geçmiş isteği başarısız olduğunda dashboard'un
     * güncel sayıları göstermesini de engeller.
     */
    fetchStaffCounts(controller.signal)
      .then((response) => {
        setCountsState({ status: 'ready', data: response });
      })
      .catch((error: unknown) => {
        // Bileşen unmount olduktan sonra gelen hata React uyarısı üretir;
        // iptal `AbortError` olduğunda durum GÜNCELLENMEZ.
        if (controller.signal.aborted) return;
        setCountsState({ status: 'error', ...describeError(error) });
      });

    return () => {
      controller.abort();
    };
  }, []);

  const showCountsSkeleton = useDelayedFlag(countsState.status === 'loading');

  const categories = countsState.status === 'ready' ? countsState.data.categories : [];
  const total = countsState.status === 'ready' ? countsState.data.total : 0;
  const isReady = countsState.status === 'ready';

  /** Görsel ağırlığın değişiklik yapmadan yeniden denemesini sağlar. */
  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title="Personel Sayıları"
        accent="Özeti"
        meta={
          /*
            ⚠ "Son güncelleme" BURAYA YAZILMAZ. Aynı bilgi hero'nun altındaki
            `MetaRow`'da daha okunaklı biçimde durur; iki yerde tekrarlanan
            zaman damgası, sayfanın "her şeyi iki kez yazan" algısını
            güçlendirir. Meta satırı yalnız kapsamı söyler: kaç kişi, kaç grup.
          */
          isReady
            ? `Toplam ${formatNumber(total)} kişi · ${categories.length} grup`
            : 'Veritabanından okunuyor'
        }
        crumbs={[{ label: 'Ana Sayfa' }, { label: 'Dashboard' }]}
        actions={
          <>
            {/*
              "Eski Kayıtlar" bölümü bu sayfadan ayrıldı; o bölüme ulaşmanın
              yolu kalmadı. Düğme, var olmayan bir hedefe "git" vaadi vermez:
              geçmiş ayrı bir ekran olduğu için başlıkta bir girdidir ve yol
              her zaman görünürdür.
            */}
            <Button
              variant="secondary"
              iconStart={<ArchiveIcon className="size-4" />}
              onClick={() => {
                navigate('/gecmis');
              }}
            >
              Eski Kayıtlar
            </Button>
            <Button
              variant="primary"
              iconStart={<PencilIcon className="size-4" />}
              onClick={() => {
                navigate('/personel-sayilari');
              }}
            >
              Sayıları Güncelle
            </Button>
          </>
        }
      />

      {/* Hata durumunda araç çubuğu KORUNUR — düğmeler kaybolmaz. */}
      {countsState.status === 'error' && (
        <Alert
          tone="danger"
          title="Personel sayıları okunamadı"
          action={
            <Button variant="secondary" size="sm" onClick={reload}>
              Tekrar Dene
            </Button>
          }
        >
          {countsState.message}
        </Alert>
      )}

      {/*
        ⚠ Hata durumunda bu blok hiç çizilmez. Sıfır değerli bir grafik
        çizmek, kullanıcıya "kimse yok" bilgisini verirdi; oysa doğrusu
        "bilinmiyor"dur. Hata zaten yukarıda sesli bir uyarı olarak verilir.
      */}
      {countsState.status !== 'error' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/*
            1 — HERO. KART DEĞİLDİR.

            Kenar çubuğu ve kenarlığı yoktur; `layout.md §4` gereği tuvalin
            üzerinde durur. Büyük sayı, çerçevelenerek değil, boyutu ve
            boşluğuyla öne çıkar. Kenarlık eklemek sayıyı değil, çerçeveyi
            vurgular.

            ⚠ SOL RAY, İÇERİĞİN KENDİ YÜKSEKLİĞİNDE BİTER. Hero'yu kartın
            içine almak yerine 3px'lik marka rayı, sayının bulunduğu kolonu
            grafikten ayırır ve iki bloğu yan yana okunur kılar.

            Ray `section` üzerinde olsaydı ızgara satırı kartın yüksekliğine
            GERDİĞİ için (grid varsayılanı `stretch`) ray içerik bittikten
            sonra da aşağı uzanır ve içeriğin parçasıymış gibi görünürdü.
            Bu yüzden ray kendi iç sarmalayıcısındadır: o blok esnemez.

            Rengi ve biçimi kenar çubuğundaki etkin menü göstergesiyle aynı
            motif: 3px, `brand-light`, `rounded-full`. Yeni bir kutu eklemeden
            hiyerarşi kuran ortak bir görsel dil.
          */}
          <section className="animate-rise-in lg:col-span-5">
            <div className="border-l-[3px] border-brand-light pl-4 lg:pl-5">
              <div className="flex flex-col gap-2">
                {/*
                  Etiket kaynakta BÜYÜK HARFLE yazılır; CSS `uppercase`
                  DÖNÜŞÜMÜ KULLANILMAZ. Türkçede noktasız `i → I` üretildiği
                  için küçük harften büyütmek hatalı sonuç verir.
                */}
                <h2 className="text-label font-medium tracking-widest text-content-muted uppercase">
                  Toplam Personel
                </h2>

                {showCountsSkeleton ? (
                  <Skeleton className="mt-1 h-10 w-32" />
                ) : (
                  <p className="flex items-baseline gap-2">
                    {/*
                      Sayının `tabular-nums` olması ZORUNLUDUR: bu değer
                      güncellemelerle değişir ve rakamların altında oluşan
                      kayma, güncellemeyi izleyen kullanıcıda yanlış
                      okunmaya yol açar.
                    */}
                    <span className="text-display font-semibold tracking-tight text-content-primary tabular-nums">
                      {formatNumber(total)}
                    </span>
                    <span className="text-body text-content-muted">kişi</span>
                  </p>
                )}
              </div>

              {/*
                Alt bilgi, ayırıcı çizgiyle AYRILIR. Kart olmadığı için
                bölümler arasındaki ilişkiyi ince bir `border-line` taşır;
                gölge veya kutu bu işi yapamaz.
              */}
              <dl className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
                <MetaRow
                  label="Güncel durum"
                  value={isReady ? 'Tüm gruplar için' : 'Okunuyor'}
                />

                <MetaRow
                  label="Son güncelleme"
                  value={isReady ? lastUpdatedLabel(categories) : '—'}
                />

                <MetaRow
                  label="Toplam nasıl hesaplanıyor"
                  value="Üretim + Endirekt"
                />
              </dl>
            </div>
          </section>

          {/*
            2 — GRAFİK. Sayfadaki TEK yüzey.

            Sayı ikiliği (hero + grafik) asimetrik bırakıldı: grafik daha
            geniş alan alır çünkü karşılaştırma onun işidir. İki eşit kart
            "template" hissi verirdi; tek yüzey + çıplak hero vermez.

            120ms gecikme: grafik hero'dan sonra gelir. Aynı anda girseler
            ikisi de "yüklendi" gibi görünür ve hiyerarşi kaybolur; sıralı
            giriş hangisinin önce okunacağını söyler.
          */}
          <div className="animate-rise-in lg:col-span-7" style={{ animationDelay: '120ms' }}>
            <Card className="flex flex-col gap-6 p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-h3 text-content-primary">
                  Toplamın gruplara göre dağılımı
                </h2>
                <p className="text-body-sm text-content-muted">
                  Toplam, Üretim ve Endirekt'in toplamıdır; hiçbir yerde elle
                  girilmez.
                </p>
              </div>

              <DistributionChart state={countsState} showSkeleton={showCountsSkeleton} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hero altındaki etiket/değer satırı.
 *
 * `<dl>` + `<dt>`/`<dd>` kullanılır: bu bir tanım listesi değil, bir
 * veri sözlüğüdür ve ekran okuyucu "Son güncelleme, 01.10.2026 09:24"
 * biçiminde okumasını bekler. Satırlar `border-line` ile ayrılır, kutuyla
 * değil — kutu bu kadar küçük bir bilgi için gürültüdür.
 */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <dt className="text-body-sm text-content-muted">{label}</dt>
      {/*
        Değer 360px'te etiketin yanına SIĞMAYABİLİR. `flex-wrap` değeri
        kendi satırına indirir; `min-w-0` ise taşmayı engeller. Kısaltma
        (`truncate`) KULLANILMAZ: "Üretim + Endirekt" yarıda kesilirse
        hesaplama kuralı anlaşılmaz hâle gelir.
      */}
      <dd className="text-label text-content-primary tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Dağılım grafiği — Üretim · Endirekt · Toplam.
 *
 * Üretim, Endirekt ve Toplam olmak üzere TAM OLARAK ÜÇ sütun çizilir.
 *
 * ⚠ Bu sunum değişikliğidir, veri değişikliği değil. Sütunlar `state` içindeki
 * `GET /api/staff-counts` yanıtından beslenir; Toplam backend'de gelir ve
 * frontend'de `Üretim + Endirekt` olarak DOĞRULANIR. Grafik hiçbir yeni
 * veri modeli icat etmez, hiçbir sabit sayı taşımaz.
 *
 * ÖLÇEK: taban `total`'dır, çünkü toplam iki parçanın toplamıdır. Her
 * sütun `value / total` oranında yükselir; böylece toplam tam yükseklikte,
 * gruplar kendi payında görünür. Toplam 0 iken pay 0'a iner; sıfıra bölen
 * `0/0` yerine korumalı hesaplanır ve alttaki boş durum mesajı devreye girer.
 *
 * ERIŞİLEBİLİRLİK: bilgi yalnızca renkle taşınmaz. Her sütunun DEĞERİ
 * üstte, KATEGORİSİ altta GÖRÜNÜR metindir; çubukların kendisi dekoratiftir
 * (`aria-hidden`). `figcaption` ekran okuyucuya üç sayıyı tek cümleyle
 * anlatır.
 */
function DistributionChart({
  state,
  showSkeleton,
}: {
  state: LoadState<{ categories: StaffCount[]; total: number }>;
  /**
   * 300ms eşiği aşıldı mı. Altındaki bayrak yanlışsa iskelet YOKTUR ve
   * alan boş bırakılır: hızlı gelen bir yanıtta iskelet 200ms görünüp
   * kaybolmak ekranı titretir ve arıza gibi okunur.
   */
  showSkeleton: boolean;
}) {
  const isReady = state.status === 'ready';
  const categories = isReady ? state.data.categories : [];
  const total = isReady ? state.data.total : 0;

  const valueOf = (category: StaffCategory) =>
    categories.find((item) => item.category === category)?.headcount ?? 0;

  const columns: Column[] = [
    { key: 'Üretim', value: valueOf('Üretim'), ...COLUMN_STYLE['Üretim'] },
    { key: 'Endirekt', value: valueOf('Endirekt'), ...COLUMN_STYLE['Endirekt'] },
    { key: 'Toplam', value: total, ...COLUMN_STYLE['Toplam'] },
  ];

  return (
    <figure className="flex flex-col gap-4">
      {/*
        Yükleme iskeleti, gerçek grafiğin ÜÇ sütunlu yapısını ve satır
        yüksekliğini taklit eder. Veri geldiğinde çubuklar yerine oturur,
        içerik zıplamaz.
      */}
      {state.status === 'loading' && showSkeleton && (
        <SkeletonRegion label="Dağılım grafiği yükleniyor">
          <div className="flex h-40 items-end gap-3 sm:gap-6 sm:h-48">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex-1">
                <Skeleton className={`h-full ${index === 2 ? 'w-full' : 'w-2/3'}`} />
              </div>
            ))}
          </div>
        </SkeletonRegion>
      )}

      {state.status === 'loading' && !showSkeleton && null}

      {isReady && total === 0 && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 sm:h-48">
          <p className="text-body-sm text-content-muted">Henüz personel sayısı girilmemiş.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              // Grafikten giriş ekranına: bir sonraki mantıklı eylem.
              window.location.assign('/personel-sayilari');
            }}
          >
            İlk sayıyı gir
          </Button>
        </div>
      )}

      {isReady && total > 0 && (
        <>
          {/* 1. satır — DEĞERLER. Çubukların üstünde, `tabular-nums`. */}
          <div className="flex items-end gap-3 sm:gap-6">
            {columns.map((column) => (
              <div key={column.key} className="flex-1 text-center">
                <span className="text-h2 font-semibold text-content-primary tabular-nums">
                  {formatNumber(column.value)}
                </span>
              </div>
            ))}
          </div>

          {/*
            2. satır — ÇUBUKLAR + TABAN ÇİZGİSİ. Alan yüksekliği sabittir;
            her sütun yüzde olarak yükselir ve `items-end` ile tabana yaslanır.

            Sıfırdan büyük ama oranı çok küçük bir değer (örn. 1 / 1000) alt
            piksele düşüp görünmez olmasın diye %2'lik bir taban uygulanır.
            Bu yüzdeyi olduğundan büyük GÖSTERMEZ; yalnızca "veri var"
            bilgisini görünür kılar. Toplam 0 ise buraya hiç girilmez.

            ⚠ TABAN ÇİZGİSİ ÖLÇEK İŞARETİDİR. Çubukların oturduğu yer
            `border-line` ile çizilir: çubuklar havada durmasın, "sıfır"
            nerede belli olsun. Daha ağır bir çizgi kullanılmaz —
            bu bir referans çizgisidir, yeni bir yüzey değil.
          */}
          <div className="flex h-40 items-end gap-3 border-b border-line sm:h-48 sm:gap-6">
            {columns.map((column) => {
              const share = total === 0 ? 0 : (column.value / total) * 100;
              const height = column.value > 0 ? Math.max(share, 2) : 0;

              return (
                <div
                  key={column.key}
                  aria-hidden="true"
                  className={`animate-grow-up flex-1 rounded-t-md ${column.barClassName}`}
                  style={{ height: `${height}%`, animationDelay: `${column.delayMs}ms` }}
                />
              );
            })}
          </div>

          {/* 3. satır — KATEGORİLER ve payları. */}
          <div className="flex gap-3 sm:gap-6">
            {columns.map((column) => {
              const share = total === 0 ? 0 : (column.value / total) * 100;

              return (
                <div key={column.key} className="flex-1 text-center">
                  {/*
                    Toplam satırı "hesaplanmış" olduğu için görsel olarak
                    diğerlerinden ayrılır; ama vurgu rengi DEĞİL, ağırlık ve
                    çizgi kullanılır. Renk farkı zaten çubukta var.
                  */}
                  <span
                    className={`block text-label ${
                      column.key === 'Toplam'
                        ? 'font-semibold text-content-primary'
                        : 'font-medium text-content-secondary'
                    }`}
                  >
                    {column.key}
                  </span>
                  <span className="mt-0.5 block text-caption text-content-muted tabular-nums">
                    %{formatShare(share)}
                  </span>
                  {/*
                    GRUP ALTINDAKİ "kişi" ETİKETİ — çubuk ölçeğinin birimini
                    söyler. Çubuk yüksekliği bir ORAN olduğu için tek başına
                    "kaç kişi" anlamına gelmez; bu etiket olmadan grafik
                    kendi ölçeğini açıklamaz.
                  */}
                  <span className="sr-only">kişi</span>
                </div>
              );
            })}
          </div>

          <figcaption className="sr-only">
            {columns
              .map(
                (column) =>
                  `${column.key} ${formatNumber(column.value)} kişi, toplamın yüzde ${formatShare(
                    total === 0 ? 0 : (column.value / total) * 100,
                  )}'i`,
              )
              .join('. ')}
            . Toplam değeri Üretim ve Endirekt'in toplamıdır.
          </figcaption>
        </>
      )}
    </figure>
  );
}

/**
 * Pay etiketi — `%70,6`.
 *
 * ⚠ EN ÇOK BİR ONDALIK. `formatNumber` varsayılan en fazla üç ondalık
 *   gösterir ve 120/170 oranı `%70,588` olarak yazılır. Üç ondalık, iki
 *   ondalıktan daha kesin değildir; yalnızca gürültüdür. Yüzde bir bütündür:
 *   tek ondalık hem yeterli hem okunur.
 */
function formatShare(share: number): string {
  return formatNumber(Math.round(share * 10) / 10);
}

/** En son güncelleme zamanı. Kayıt yoksa `null` döner. */
function latestUpdate(categories: StaffCount[]): string | null {
  const timestamps = categories
    .map((category) => category.updatedAt)
    .filter((value): value is string => typeof value === 'string');

  if (timestamps.length === 0) {
    return null;
  }

  return timestamps.reduce((latest, value) => (value > latest ? value : latest));
}

/**
 * Son güncelleme zamanı için EKRAN METNİ.
 *
 * Kayıt yoksa `formatDateTime` yerine `—` gösterilir. Boş bir tarihi
 * biçimlendirmek ya `Invalid Date` ya da epoch başlangıcı (1970) üretir;
 * ikisi de kullanıcıya "veri bozuk" izlenimi verir. Doğrusu bilgiyi
 * olmadığını açıkça söylemektir.
 */
function lastUpdatedLabel(categories: StaffCount[]): string {
  const latest = latestUpdate(categories);

  return latest === null ? '—' : formatDateTime(latest);
}

/** Ekranda gösterilen durum. */
type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; unavailable: boolean }
  | { status: 'ready'; data: T };
