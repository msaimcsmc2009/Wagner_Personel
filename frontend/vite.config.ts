import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Backend adresi kaynak koda gömülmez; ortam değişkeninden okunur.
 * Tanımlı değilse geliştirme varsayılanına düşer.
 */
const backendOrigin = process.env['BACKEND_ORIGIN'] ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    // Port meşgulse rastgele başka bir port seçmek yerine hata verir.
    // Aksi halde kullanıcı 5173 beklerken uygulama 5174'te açılır ve
    // "neden bağlanmıyor" hatası üretir.
    strictPort: true,

    proxy: {
      // Frontend '/api' isteklerini backend'e proxy'ler. Böylece tarayıcı
      // için istek aynı origin'den yapılır ve CORS'a gerek kalmaz.
      '/api': {
        target: backendOrigin,
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4173,
    strictPort: true,
  },

  build: {
    outDir: 'dist',
    // Kaynak haritaları üretimde de tutulur: kullanıcı hata raporlarının
    // okunabilir olması, kazançtan daha önemlidir.
    sourcemap: true,
  },
});
