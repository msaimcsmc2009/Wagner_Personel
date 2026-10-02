import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { AlertTriangleIcon } from './icons/UiIcons';

/**
 * Render hata sınırı.
 *
 * ⚠ BU SINIR OLMADAN BİR EKRAN ÇÖKERSE BEYAZ EKRAN OLUR.
 *   React, render sırasında oluşan hatayı yakalayamaz: bileşen ağacını
 *   tamamen söküp boş bir `div` bırakır. Kullanıcı o an boş beyaz bir sayfa
 *   görür ve hatanın nerede olduğunu ne arayüz ne konsol gösterir.
 *
 *   Bu sınır o sessiz çökmeyi dürüst bir ekrana çevirir: ne olduğunu söyler,
 *   ne yapılabileceğini söyler, gerçek nedeni konsola bırakır.
 *
 * CANLI ÖRNEK: geçmiş ekranı, backend'in çıplak dizi döndürmesi yüzünden
 * `state.data.length` okumasında patlıyordu ve uygulama beyaz ekrana düşüyordu.
 * Sözleşme düzeltildi, ancak bir sonraki şekil hatasının aynı sonucu
 * vermemesi için sınır yerinde durur.
 *
 * ⚠ Hata İÇERİĞİ KULLANICIYA GÖSTERİLMEZ. HTTP kodu, yığın izi veya ham
 *   hata metni arayüzde yer almaz (AGENTS.md: hata mesajı HTTP kodu
 *   adını taşımaz). Gerçek neden yalnızca konsola yazılır.
 *
 * KAPSAM: yalnızca RENDER hatalarını yakalar. Olay içinde (`onClick`,
 * `fetch` `.then`) oluşan hatalar bu sınırın işi değildir; onlar ekranların
 * kendi hata durumlarında ele alınır.
 */

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    /*
      Konsol, GELİŞTİRİCİ içindir. Bileşen yığını burada kalır; arayüzde
      gösterilmez.
    */
    console.error('Render hatası — arayüz kurtarıldı:', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;

    if (error === null) {
      return this.props.children;
    }

    /*
      "Tekrar Dene" sayfayı YENİDEN YÜKLER, yalnızca sınıf durumunu temizlemez.
      Hata verinin biçiminden geliyorsa (ör. beklenmeyen bir API gövdesi) aynı
      veri aynı hatayı yeniden üretir; yalnızca durum sıfırlamak kullanıcıyı
      aynı boş ekrana geri gönderir.
    */
    const reload = () => {
      window.location.reload();
    };

    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-120">
          <EmptyState
            icon={<AlertTriangleIcon className="size-12" />}
            title="Bu sayfa yüklenemedi"
            body="Sayfada beklenmeyen bir sorun oluştu ve ekran güvenli duruma alındı. Sayfayı yenilemek sorunu çözerse devam edebilirsiniz; çözmezse uygulama yöneticisine bildirin."
            actions={
              <Button variant="primary" onClick={reload}>
                Sayfayı Yenile
              </Button>
            }
          />
        </div>
      </div>
    );
  }
}