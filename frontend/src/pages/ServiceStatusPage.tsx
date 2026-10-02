import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ServiceStatus, type HealthViewState } from '../components/ServiceStatus';
import { ApiError } from '../services/apiClient';
import { fetchHealthStatus } from '../services/healthService';

/**
 * Sistem durumu — geliştirici sağlık ekranı (`/durum`).
 *
 * Ürün ekranı DEĞİLDİR; kenar çubuğunda görünmez. Frontend ile backend'in
 * birlikte çalıştığını gösterir. Dashboard bu ekranın yerini alır.
 */
export function ServiceStatusPage() {
  const [state, setState] = useState<HealthViewState>({ kind: 'loading' });

  const loadHealth = useCallback((signal?: AbortSignal) => {
    setState({ kind: 'loading' });

    fetchHealthStatus(signal)
      .then((status) => {
        setState({ kind: 'success', status });
      })
      .catch((error: unknown) => {
        if (signal?.aborted === true) return;

        if (error instanceof ApiError) {
          /*
            ⚠ Hata kodu EKRANDA gösterilmez (`ServiceStatus`), ama burada
              konsola yazılır. Aksi halde ekranda "ayrıntı konsola yazıldı"
              denirken konsolda hiçbir şey bulunamaz.
          */
          console.error(`Sağlık kontrolü başarısız (${error.code}):`, error.message);
          setState({ kind: 'error', message: error.message, code: error.code });
          return;
        }

        console.error('Beklenmeyen hata', error);
        setState({
          kind: 'error',
          message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
          code: 'UNKNOWN',
        });
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadHealth(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadHealth]);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        title="Sistem"
        accent="Durumu"
        meta="Frontend ve backend bağlantısı"
        crumbs={[{ label: 'Ana Sayfa' }, { label: 'Sistem Durumu' }]}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              loadHealth();
            }}
          >
            Yenile
          </Button>
        }
      />

      {/*
        ⚠ DIŞARIDA `Card` YOK. `ServiceStatus` KENDİSİ bir kartaçevresidir
        (yüzey + 1px kenarlık + 12px yarıçap). Dışarıdan bir `Card` daha
        sarmalamak "kutu içinde kutu" üretir — bu, jenerik dashboard
        görünümünün en belirgin nedenlerinden biridir ve layout.md §7'de açıkça
        reddedilir.
      */}
      <ServiceStatus
        state={state}
        onRetry={() => {
          loadHealth();
        }}
      />
    </div>
  );
}
