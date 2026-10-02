/// <reference types="vite/client" />

/**
 * Vite, yalnızca "VITE_" önekiyle başlayan ortam değişkenlerini istemciye
 * sızdırır. Bu arayüz, sızan değişkenlerin tipini burada tanımlar.
 *
 * `?` ile işaretlenenler opsiyoneldir; tanımlanmazsa kodda varsayılan
 * kullanılır. Supabase anahtarları bilinçli olarak burada YOKTUR: sunucu
 * anahtarı istemciye sızmamalıdır.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
