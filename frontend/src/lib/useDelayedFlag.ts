import { useEffect, useState } from 'react';

/**
 * İskelet göstergesini geciktirir — components.md §Skeleton.
 *
 * İstek 300ms'den hızlı tamamlanırsa iskelet hiç gösterilmez. Aksi halde
 * ekran bir anlık gri lekelerden geçip gerçek içeriğe döner; bu "flash" bir
 * arıza gibi okunur ve iskeletin hiç gösterilmemesinden daha kötüdür.
 *
 * Süre `components.md` içindeki eşiğin (300ms) altına düşürülemez; eşiğin
 * kendisi değişecekse bu fonksiyonun varsayılanı güncellenir.
 */
const SKELETON_DELAY_MS = 300;

export function useDelayedFlag(isPending: boolean, delayMs: number = SKELETON_DELAY_MS): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    // İstek bittiğinde sayaç durmadan sıfırlanır; aksi halde sonraki istekte
    // anında `true` döner ve gecikme koruması kaybolur.
    if (!isPending) {
      setElapsed(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setElapsed(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isPending, delayMs]);

  return isPending && elapsed;
}
