import { ApiError } from '../services/apiClient';
import { isDataSourceUnavailable } from '../services/staffCountService';

/**
 * Hata nesnesini ekran metnine çevirir.
 *
 * İki ekran (`/` ve `/gecmis`) aynı ağ hatasını aynı biçimde göstermelidir;
 * bu yardımcı o tek noktadır. Mesajın İKİ kaynağı vardır:
 *
 *  - `ApiError` → backend'in döndürdüğü, zaten Türkçe ve eyleme dönük mesaj.
 *    HTTP kodu veya ham hata metni ASLA gösterilmez; kullanıcı ne yapacağını
 *    bilmelidir, kod numarasını değil.
 *  - Diğer her şey (ağ kesintisi, zaman aşımı, beklenmedik hata) → kullanıcıya
 *    güven veren ama dürüst olmayan tek bir cümle. Gerçek neden konsola
 *    yazılır, arayüze sürülmez.
 *
 * `unavailable` ayrıca taşınır: bağlantı yokken ekran "veri kaynağına
 * ulaşılamıyor" ayrımını yapıp kullanıcıyı beklemesi gerektiğini söyleyebilir.
 * HTTP kodu değil, anlamsal bir ayrımdır.
 */
export function describeError(error: unknown): { message: string; unavailable: boolean } {
  return {
    message:
      error instanceof ApiError
        ? error.message
        : 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
    unavailable: isDataSourceUnavailable(error),
  };
}
