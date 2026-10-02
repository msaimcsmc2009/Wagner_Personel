import type { ReactNode } from 'react';
import { AlertCircleIcon, CheckIcon, SpinnerIcon } from './icons/UiIcons';
import { Button } from './ui/Button';
import { formatDateTime, formatNumber } from '../lib/format';
import type { HealthStatus } from '../types/health';

/**
 * Sağlık ekranının tek arayüz parçası: backend durumu.
 *
 * components.md kurallarına uyar:
 *  - Üç durumun tamamı: loading / başarılı / hata
 *  - Durum hem RENK hem METİN hem İKON ile bildirilir (renk tek başına
 *    asla sinyal değildir)
 *  - Kart: yüzey + 1px kenarlık + 12px yarıçap, dinlenirken GÖLGE YOK
 *  - Emoji yerine gerçek SVG ikon, 2px kontur, currentColor
 *  - Erişilebilir ad, role="status" ve aria-live="polite"
 *
 * ⚠ İKON VE BİÇİMLENDİRİCİ KOPYALARI SİLİNDİ. Bu dosya kendi `SpinnerIcon`,
 *   `CheckIcon`, `AlertIcon`, `formatNumber` ve `formatTimestamp`
 *   kopyalarını taşıyordu. Aynı ikon iki yerde farklı çizilirse ekran
 *   "toplama" görünür; aynı sayı iki yerde farklı ondalık basamağıyla
 *   yazılırsa kullanıcı hangisinin doğru olduğunu bilemez. Kaynak tek yer:
 *   `icons/UiIcons` ve `lib/format`.
 *
 * ⚠ HATA KODU EKRANDA GÖSTERİLMEZ. AGENTS.md ve `describeError` kuralı:
 *   kullanıcı HTTP kodu değil, ne yapacağını bilmelidir. Kod konsola
 *   yazılır; ekranda tek bir eyleme yönlendiren Türkçe cümle kalır.
 */

export type HealthViewState =
  | { kind: 'loading' }
  | { kind: 'success'; status: HealthStatus }
  | { kind: 'error'; message: string; code: string };

interface ServiceStatusProps {
  state: HealthViewState;
  onRetry: () => void;
}

const CARD_BASE = 'rounded-xl border border-line bg-surface p-5';

function StatusRow({
  tone,
  children,
}: {
  tone: 'info' | 'success' | 'danger';
  children: ReactNode;
}) {
  const toneClass = {
    info: 'bg-info-soft text-info-text',
    success: 'bg-success-soft text-success-text',
    danger: 'bg-danger-soft text-danger-text',
  }[tone];

  return (
    <p className={`flex items-center gap-2 rounded-lg px-3 py-2 text-body ${toneClass}`}>
      {children}
    </p>
  );
}

/**
 * ⚠ Bu eski yerel biçimlendiriciler kaldırıldı. `formatNumber` ve
 *   `formatTimestamp` artık `lib/format`'tan gelir; burada ikinci bir
 *   kültür tanımı tutmak, aynı sayının iki ekranda iki biçimde
 *   görünmesi demekti.
 */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-2 first:border-t-0">
      <dt className="text-body-sm text-content-muted">{label}</dt>
      <dd className="text-body-sm font-medium text-content-primary tabular-nums">{value}</dd>
    </div>
  );
}

export function ServiceStatus({ state, onRetry }: ServiceStatusProps) {
  return (
    <section className={CARD_BASE} aria-labelledby="service-status-heading">
      <h2 id="service-status-heading" className="text-h3 text-content-primary">
        Sunucu Durumu
      </h2>

      {/* Canlı durum değişiklikleri ekran okuyucu tarafından duyurulur. */}
      <div role="status" aria-live="polite" className="mt-4">
        {state.kind === 'loading' && (
          <StatusRow tone="info">
            <SpinnerIcon />
            <span>Sunucuya bağlanılıyor…</span>
          </StatusRow>
        )}

        {state.kind === 'error' && (
          <div className="flex flex-col items-start gap-3">
            <StatusRow tone="danger">
              <AlertCircleIcon className="size-5 shrink-0" />
              <span>Backend&apos;e ulaşılamadı</span>
            </StatusRow>

            <p className="text-body-sm text-content-secondary">{state.message}</p>

            {/*
              Hata kodu burada YAZILMAZ. Kullanıcı `504` ya da
              `MIGRATION_NOT_APPLIED` görse ne yapacağını bilmez; kod
              konsola gider, ekranda yönlendirici bir cümle kalır.
            */}
            <p className="text-caption text-content-muted">
              Bu ekran yalnızca yöneticiler içindir. Sorun devam ederse
              uygulama yöneticinize başvurun; hata ayrıntısı tarayıcı
              konsoluna yazıldı.
            </p>

            <Button variant="secondary" onClick={onRetry}>
              Tekrar Dene
            </Button>
          </div>
        )}

        {state.kind === 'success' && (
          <div className="flex flex-col gap-3">
            <StatusRow tone="success">
              <CheckIcon className="size-5 shrink-0" />
              <span>Backend çalışıyor</span>
            </StatusRow>

            <dl>
              <DetailRow label="Servis" value={state.status.service} />
              <DetailRow label="Sürüm" value={state.status.version} />
              <DetailRow label="Ortam" value={state.status.environment} />
              <DetailRow
                label="Çalışma süresi"
                value={`${formatNumber(state.status.uptimeSeconds)} sn`}
              />
              <DetailRow
                label="Zaman damgası"
                value={formatDateTime(state.status.timestamp)}
              />
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
