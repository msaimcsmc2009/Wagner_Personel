import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterChip, FilterChipRow } from '../components/ui/FilterChip';
import { Skeleton, SkeletonRegion } from '../components/ui/Skeleton';
import { ArchiveIcon, BuildingIcon, UsersIcon } from '../components/icons/UiIcons';
import { cn } from '../lib/cn';
import { formatDate, formatNumber, formatTime } from '../lib/format';
import { describeError } from '../lib/describeError';
import { useDelayedFlag } from '../lib/useDelayedFlag';
import { fetchStaffCountHistory } from '../services/staffCountService';
import {
  STAFF_CATEGORIES,
  type StaffCategory,
  type StaffCountHistory,
} from '../types/staffCount';

/**
 * Geçmiş — sayı değişikliklerinin kalıcı listesi.
 *
 * ⚠ KAPSAM: burada PERSONEL KAYDI yoktur. Satır satır kişi, sicil, izin
 * veya vardiya bilgisi tutulmaz; yalnızca "bir grupta kaç kişi vardı"
 * sorusunun cevabı, tarih sırasıyla saklanır.
 *
 * Bu liste SİLİNMEZ ve DÜZELTİLMEZ. Her kayıt, o andaki sayının geçmişte
 * ne olduğunu değiştirilemez biçimde kanıtlar. "Bugün Üretim'de 120 kişi
 * var" bilgisi, geçen ay 118 kişi vardı bilgisiyle birlikte anlam kazanır.
 *
 * Dashboard yalnızca GÜNCEL durumu gösterir; geçmiş burada, kendi
 * ekranında durur. İki ekranı ayırmak, dashboard'u tek bakışta okunur
 * tutar ve geçmişi okumak isteyen kullanıcıyı beklemekten kurtarır.
 */

/** Kategoriye göre görsel ton. Renk TEK BAŞINA anlam taşımaz; yanında etiket vardır. */
const CATEGORY_COLOR: Record<StaffCategory, string> = {
  Üretim: 'bg-chart-1',
  Endirekt: 'bg-chart-2',
};

/**
 * Satır giriş animasyonunda GEÇİKME ADIMI.
 *
 * Satırlar peş peşe 20ms arayla gelir. Bu değer bilinçli olarak büyük
 * değil: 40ms olsaydı 30 satırlık bir liste 1.2 saniye boyunca "doluyor"
 * gibi görünür ve tablo arızalı okunur.
 */
const ROW_STAGGER_MS = 20;

/**
 * ⚠ GECİKME TAVANI — animasyonun toplam bekleme süresi sınırsız olamaz.
 *
 * Kullanıcı yüzlerce kayda sahip olabilir. `index * 20ms` kuralı
 * uygulansaydı 200 satırlık bir tablo 4 saniye boyunca eksik görünürdü.
 *
 * Bu yüzden gecikme `ROW_STAGGER_MAX` satırından sonra SABİTLENİR:
 * ilk satırlar kademeli gelir, kalanlar birlikte. Kullanıcı "veri doluyor"
 * izlenimini ilk yarım saniyede alır, tablo sonra tamamlanır.
 *
 * 8 × 20ms = 160ms. Bu, `design-system.md §7`'nin "180-240ms yüzeyler"
 * kuralının içinde kalır.
 */
const ROW_STAGGER_MAX = 8;

const CATEGORY_ICON: Record<StaffCategory, typeof UsersIcon> = {
  Üretim: BuildingIcon,
  Endirekt: UsersIcon,
};

type HistoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string; unavailable: boolean }
  | { status: 'ready'; data: StaffCountHistory[] };

/** `null` = filtre yok (hepsi). */
type CategoryFilter = StaffCategory | null;

/**
 * Tek seferde istenen kayıt sayısı.
 *
 * 50 kayıt, geçmiş sayfasını ilk açılışta anlamlı bir liste yapar. Daha
 * fazlası için sayfalama gerekir; o, veri hacmi büyüdüğünde eklenmeli —
 * şimdi 50 satırlık bir listeye sayfalama koymak, olmayan bir sorunu
 * çözmektir.
 */
const HISTORY_LIMIT = 50;

export function HistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<CategoryFilter>(null);
  const [state, setState] = useState<HistoryState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    fetchStaffCountHistory(
      filter === null ? { limit: HISTORY_LIMIT } : { category: filter, limit: HISTORY_LIMIT },
      controller.signal,
    )
      .then((response) => {
        setState({ status: 'ready', data: response.data });
      })
      .catch((error: unknown) => {
        // Bileşen unmount olduktan sonra gelen hata React uyarısı üretir;
        // iptal `AbortError` olduğunda durum GÜNCELLENMEZ.
        if (controller.signal.aborted) return;
        setState({ status: 'error', ...describeError(error) });
      });

    return () => {
      controller.abort();
    };
  }, [filter]);

  // 300ms altındaki yanıtta iskelet titremesi arıza gibi okunur.
  const showSkeleton = useDelayedFlag(state.status === 'loading');

  /** Son görülen kayıt sayısı — meta satırında bağlam verir. */
  const resultCount = state.status === 'ready' ? state.data.length : 0;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title="Geçmiş"
        accent="Eski Kayıtlar"
        meta={
          state.status === 'ready'
            ? `Son ${formatNumber(resultCount)} değişiklik · kayıtlar silinmez`
            : 'Kayıtlar okunuyor'
        }
        crumbs={[{ label: 'Ana Sayfa' }, { label: 'Eski Kayıtlar' }]}
        actions={
          <Button variant="secondary" onClick={() => { navigate('/'); }}>
            Dashboard'a Dön
          </Button>
        }
      />

{/*
        Kategori filtresi.

        Üç düğme, `aria-pressed` ile seçim durumunu bildirir: ekran okuyucu
        kullanıcısı hangi filtrenin açık olduğunu duyar. `role="group"` +
        `aria-label` ile filtrelerin bir araya ait olduğu da anlaşılır.

        Filtre tablonun ÜSTÜNDE ve DIŞINDADIR; tablonun içine gömülmez. Gömülü
        filtre, "hangi satırların gizlendiği" sorusunu cevaplamayı zorlaştırır
        ve dar ekranda başlığı ezer.

        ⚠ ETKİN FİLTRE ÇİPİ: bir filtre açıkken çip satırı görünür
        (`FilterChipRow`, tables.md §3). Çip olmadan "Tümü / Üretim /
        Endirekt" düğmelerinden hangisinin açık olduğu yalnızca dolgu
        rengine bakılarak anlaşılır; o da renk tek başına sinyal demektir.
        Çip metinle söyler ve tek tıkla kaldırılabilir.
      */}
      <div className="flex flex-col gap-3">
        <div
          role="group"
          aria-label="Kategoriye göre süz"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-label font-medium text-content-muted">Kategori</span>

          <FilterButton active={filter === null} onClick={() => { setFilter(null); }}>
            Tümü
          </FilterButton>

          {STAFF_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICON[category];

            return (
              <FilterButton
                key={category}
                active={filter === category}
                onClick={() => { setFilter(category); }}
                iconStart={<Icon className="size-4" />}
              >
                {category}
              </FilterButton>
            );
          })}
        </div>

        <FilterChipRow onClearAll={() => { setFilter(null); }}>
          {filter !== null && (
            <FilterChip label="Grup" value={filter} onRemove={() => { setFilter(null); }} />
          )}
        </FilterChipRow>
      </div>

      {/*
        HATA durumunda filtre KORUNUR. Filtreyi gizlemek, kullanıcının hata
        varken bile daraltma yapabileceğini düşündürür; oysa hata ağ
        katmanındadır ve filtreyle ilgisi yoktur.
      */}
      {state.status === 'error' && (
        <Alert
          tone="danger"
          title="Geçmiş kayıtları okunamadı"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                /*
                  `filter` aynı değerle yeniden tetiklenmez (useEffect
                  bağımlılığı değişmemiştir). Bu yüzden sayfa yeniden
                  yüklenir; tek başına `setState` çağırmak yalnızca durumu
                  sıfırlar, isteği yeniden başlatmaz.
                */
                window.location.reload();
              }}
            >
              Tekrar Dene
            </Button>
          }
        >
          {state.message}
          {state.unavailable && ' Bağlantı kurulduğunda sayılar otomatik yüklenecek.'}
        </Alert>
      )}

      <Card padding="none">
        <div className="flex flex-col gap-5 p-5">
          <CardHeader
            title="Sayı değişiklikleri"
            description="Her kayıt, o andaki sayının geçmişte ne olduğunu değiştirilemez biçimde gösterir."
          />

          {state.status === 'loading' ? (
            showSkeleton && <HistorySkeleton />
          ) : state.status === 'error' ? null : state.data.length === 0 ? (
            filter === null ? (
              <EmptyState
                icon={<ArchiveIcon className="size-12" />}
                title="Henüz sayı değişikliği kaydedilmedi"
                body="İlk sayıyı girdiğinizde değişiklikler burada listelenir ve silinmeden tutulur."
                actions={
                  <Button
                    variant="primary"
                    onClick={() => {
                      navigate('/personel-sayilari');
                    }}
                  >
                    Sayıları Güncelle
                  </Button>
                }
              />
            ) : (
              /*
                FİLTRELİ BOŞ DURUM — tables.md §6, en sık atlanan durum.

                Mesaj, listenin boş olduğunu değil, FİLTRENİN boş sonuç
                verdiğini söyler. Kullanıcı "veriler mi silindi?" diye
                düşünmemelidir; hangi filtrenin boş döndüğü ve ondan nasıl
                çıkılacağı açıkça yazılıdır.
              */
              <EmptyState
                icon={<ArchiveIcon className="size-12" />}
                title={`${filter} için değişiklik kaydı yok`}
                body={`${
                  filter === 'Üretim'
                    ? 'Üretim'
                    : 'Endirekt'
                } grubunun sayısı henüz hiç değiştirilmedi. Tüm kayıtları görmek için "Tümü" filtresini seçin.`}
                actions={
                  <Button variant="secondary" onClick={() => { setFilter(null); }}>
                    Tümünü Göster
                  </Button>
                }
              />
            )
          ) : (
            <HistoryTable entries={state.data} />
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Filtre düğmesi.
 *
 * `aria-pressed` seçili/seçili değil durumunu bildirir; `role="tab"` DEĞİL
 * çünkü bunlar panel değiştiren sekmeler değil, aynı tabloyu süzen
 * düğmelerdir.
 */
function FilterButton({
  active,
  onClick,
  iconStart,
  children,
}: {
  active: boolean;
  onClick: () => void;
  iconStart?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? 'primary' : 'secondary'}
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      iconStart={iconStart}
    >
      {children}
    </Button>
  );
}

/**
 * İskelet, gerçek tabloyla AYNI yapıda ve aynı sütun genişliklerinde çizilir.
 *
 * Satır sayısı sabit 4'tür, "3" değil: geçmişteki kayıt sayısı veriye
 * bağlıdır ve iskelet onu bilmez. Tutarlı bir iskelet, veri geldiğinde
 * satırların yerinden oynamasını önler.
 *
 * Sütunlar `hidden sm:table-cell` ile gizlendiği için iskelet de aynı
 * sınıfı taşır; aksi halde 360px'te iskelet dört sütunlu, gerçek tablo
 * üç sütunlu görünür ve sayfa zıplardı.
 */
function HistorySkeleton() {
  return (
    <SkeletonRegion label="Geçmiş kayıtları yükleniyor">
      <div className="w-full">
        <div className="flex h-10 items-center gap-3 border-b border-line bg-surface-sunken px-3 sm:px-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="ml-auto h-3 w-16" />
          <Skeleton className="hidden h-3 w-14 sm:block" />
        </div>

        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'flex h-12 items-center gap-3 px-3 sm:px-4',
              index === 0 ? '' : 'border-t border-line',
            )}
          >
            <Skeleton className="h-4 w-24 sm:w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-10" />
            <Skeleton className="hidden h-4 w-12 sm:block" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/**
 * Geçmiş tablosu — tables.md.
 *
 * Gerçek `<table>` semantiği: `<thead>`, `<tbody>`, `scope="col"` ve
 * `scope="row"`. Bu bir liste DEĞİLDİR — dört sütunlu, sıralı ve sayısal
 * bir kayıt tablosudur; ekran okuyucu satırı "1 Ekim 2026, Üretim, 119
 * kişi, 1 azaldı" olarak okumalıdır.
 *
 * Sütun hiyerarşisi:
 *   - TARİH    → sola, ikincil (`content-muted`): ne zaman
 *   - GRUP     → sola, birincil: hangi grup
 *   - PERSONEL → sağa, `tabular-nums`, güçlü: kaç kişi
 *   - DEĞİŞİM → sağa, `tabular-nums`: önceki kayda göre fark
 *
 * Sayılar SAĞA ve `tabular-nums` ile hizalanır; metin sola. Dikey çizgi
 * YOKTUR — sütunları ayıran şey hizalama ve boşluktur, çizgi değil. Satır
 * yüksekliği 48px; hover yüzeyi `surface-tinted`.
 */
function HistoryTable({ entries }: { entries: StaffCountHistory[] }) {
  /**
   * `id → bir önceki (daha eski) kayıttaki değer`.
   *
   * ⚠ YÖN KURALI: backend kayıtları `recorded_at DESC` ile döndürür, yani
   * dizi EN YENİDEN ESKİYE gider. Bu yüzden bir satırın "değişimi" kendisinden
   * sonraki, aynı kategorideki ESKİ kayda göre hesaplanır.
   *
   * Dizi baştan sona gezilirken ilerideki kayda bakılırsa hata şudur: en yeni
   * satır hiç fark göstermez, fark eski satırlara yazılır ve işaret ters
   * çevrilir (18 kişiden 20'ye çıkış "+2" değil "−2" görünür). Bu yüzden
   * dizi SONDAN BAşa gezilir ve önceki değer eşlenir.
   *
   * Aynı kategorinin eski kaydı listede hemen bitişik olmak zorunda değildir;
   * arama kategori bazındadır. İlk kaydın farkı `undefined` kalır ve
   * "değişim yok" olarak gösterilir — henüz karşılaştırılacak bir önceki
   * kayıt yoktur.
   */
  const olderById = useMemo(() => {
    const map = new Map<number, number>();
    const seenFromOlder = new Map<StaffCategory, number>();

    for (const entry of [...entries].reverse()) {
      const older = seenFromOlder.get(entry.category);

      if (older !== undefined) {
        map.set(entry.id, older);
      }

      seenFromOlder.set(entry.category, entry.headcount);
    }

    return map;
  }, [entries]);

  return (
    /*
      Yatay taşma sarmalayıcısı — responsive.md §7.

      Bu tablo kart içinde bir blok olduğu için yalnız tablo kaydırılır, sayfa
      değil. Dört sütun dar ekranda sıkışır; sarmalayıcı son çare olarak
      yatay kaydırmayı mümkün kılar. Asıl daraltma işi aşağıdadır: `sm`
      altında saat gizlenir, `Değişim` sütunu gizlenir ve hücre dolgusu
      `px-3`'e iner. Bu üçü birlikte 360px'te yatay taşma olmadan sığdırır;
      sarmalayıcı yalnız o sırada devreye girer.
    */
    <div className="overflow-x-auto">
      <table className="w-full min-w-full border-collapse">
      {/* Görünür başlık "Sayı değişiklikleri" ne olduğunu söylemez; bu
          `caption` ekran okuyucuya tablonun tamamını tek cümleyle anlatır. */}
      <caption className="sr-only">
        Sayı değişiklikleri. {formatNumber(entries.length)} kayıt, en yeniden eskiye doğru
        sıralı. Kayıtlar silinmez.
      </caption>

      {/*
        Başlık zeminlidir (`surface-sunken`) ve gövdeden `border-b` ile
        ayrılır. Başlığın kendi alt kenarlığı olmaması, ayrımın tek bir yerden
        okunmasını sağlar.

        Hücre dolgusu `px-3 sm:px-4`'tür: 360px'te dört `px-4` hücre 128px
        yatay yer çalar ve tarih sütunu taşar. `sm` üzerinde `px-4`'e dönmek,
        geniş ekranda sütunların nefes almasını korur.
      */}
      <thead>
        <tr className="h-10 border-b border-line bg-surface-sunken text-label font-medium tracking-wide text-content-secondary uppercase">
          <th scope="col" className="px-3 text-left sm:px-4">
            Tarih
          </th>
          <th scope="col" className="px-3 text-left sm:px-4">
            Grup
          </th>
          <th scope="col" className="px-3 text-right sm:px-4">
            Personel
          </th>
          {/* 480px altında gizlenir: dar ekranda dört sütun sıkışır. */}
          <th scope="col" className="hidden px-4 text-right sm:table-cell">
            Değişim
          </th>
        </tr>
      </thead>

      <tbody>
        {entries.map((entry, index) => {
          const older = olderById.get(entry.id);
          // Fark, ESKİ değere göre hesaplanır: 18 → 20 ise `+2`.
          const delta = older === undefined ? null : entry.headcount - older;
          const isFirst = index === 0;

return (
            <tr
              key={entry.id}
              className={cn(
                'h-12 transition-colors duration-fast hover:bg-surface-tinted',
                // Kademeli giriş: tablo bir bütün olarak değil, bir dizi
                // olarak okunur. `Math.min` tavan sayesinde gecikme
                // `ROW_STAGGER_MAX` satırından sonra sabitlenir.
                'animate-row-in',
                isFirst ? '' : 'border-t border-line',
              )}
              style={{
                animationDelay: `${Math.min(index, ROW_STAGGER_MAX) * ROW_STAGGER_MS}ms`,
              }}
            >
              {/*
                Tarih: dar ekranda YALNIZCA gün/ay/yıl, geniş ekranda saat
                dahil.

                ⚠ Neden iki biçim: `01.10.2026 09:24` 13px'te ~115px genişlikte
                ve 360px'te dört sütunla birlikte tabloyu taşırır. Saat
                daraltmada ilk kaybedilen bilgidir — kaydın HANGİ GÜN olduğu
                korunur, "kaçta" bilgisi ise ekran genişlediğinde geri gelir.
                Bilgi kasten kademeli gizlenir, tablo taşmaz.
              */}
              <td className="px-3 text-body-sm whitespace-nowrap text-content-muted tabular-nums sm:px-4">
                <time dateTime={entry.recordedAt}>
                  <span>{formatDate(entry.recordedAt)}</span>
                  <span className="hidden sm:inline">
                    {` ${formatTime(entry.recordedAt)}`}
                  </span>
                </time>
              </td>

              {/*
                `scope="row"` grup sütunundadır: satırın KİMLİĞİ grup ve
                tarihtir. Nokta rengi tek başına anlam taşımaz; yanında
                etiket vardır.
              */}
              <th scope="row" className="px-3 text-left font-normal sm:px-4">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`size-2 shrink-0 rounded-full ${CATEGORY_COLOR[entry.category]}`}
                  />
                  <span className="text-body text-content-primary">{entry.category}</span>
                  {isFirst && (
                    <span className="hidden text-caption text-content-muted lg:inline">
                      · En son kayıt
                    </span>
                  )}
                </span>
              </th>

              <td className="px-3 text-right text-body font-medium text-content-primary tabular-nums sm:px-4">
                {formatNumber(entry.headcount)}
              </td>

              <td className="hidden px-4 text-right sm:table-cell">
                {delta === null ? (
                  <span className="text-caption text-content-muted">—</span>
                ) : (
                  <span
                    className={cn(
                      'text-body-sm tabular-nums',
                      delta > 0
                        ? 'text-success-text'
                        : delta < 0
                          ? 'text-danger-text'
                          : 'text-content-muted',
                    )}
                  >
                    {/* Glif yönü gösterir; ekran okuyucuya cümle olarak da verilir. */}
                    <span aria-hidden="true">
                      {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'}
                    </span>{' '}
                    {delta > 0 ? '+' : delta < 0 ? '−' : '±'}
                    {formatNumber(Math.abs(delta))}
                    <span className="sr-only">
                      {delta > 0
                        ? ` (önceki kayda göre ${formatNumber(delta)} kişi artmış)`
                        : delta < 0
                          ? ` (önceki kayda göre ${formatNumber(Math.abs(delta))} kişi azalmış)`
                          : ' (önceki kayıtla aynı)'}
                    </span>
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
      </table>
    </div>
  );
}
