import { useEffect, useState } from 'react';

/**
 * `matchMedia` sorgusunu React durumuna bağlar.
 *
 * responsive.md §2 kenar çubuğu için ÜÇ ayrı mod tanımlar:
 *   < 1024        off-canvas drawer (280px)
 *   1024–1279     64px ikon rayı
 *   ≥ 1280        256px genişletilmiş kenar çubuğu
 *
 * ⚠ Neden hook gerekiyor: bu modun YALNIZCA CSS ile çözülemez. CSS metni
 * gizleyebilir, ama ikon rayında her öğenin AÇIKLAMAYA İHTİYACI vardır;
 * etiket DOM'da yoksa ekran okuyucuya ne yazılacağı da yoktur. Yani JS,
 * hangi etiketin var olması gerektiğini bilmelidir. `matchMedia` bunu
 * verir ve ekranı dinler; `resize` olayına `window.innerWidth` ile bakmak
 * ise kırılgan ve gecikmelidir.
 *
 * Sunucu tarafı render'ında `false` döner. Uygulama saf istemci tarafıdır,
 * bu yüzden ilk boyama bir kare gecikmeli olabilir; bu kabul edilir çünkü
 * yanlış modda geçici bir kenar çubuğundan iyidir.
 *
 * `addEventListener('change')` kullanılır; eski `addListener` Safari'de
 * çalışmaz ve TypeScript'te deprecation uyarısı üretir.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Efekt anında yeniden okunur: ilk render ile efekt arasında pencere
    // boyutu değişmiş olabilir (ör. hızlı yön değişimi).
    setMatches(list.matches);

    list.addEventListener('change', onChange);

    return () => {
      list.removeEventListener('change', onChange);
    };
  }, [query]);

  return matches;
}
