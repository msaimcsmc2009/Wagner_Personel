import cors from 'cors';
import express, { type Express } from 'express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiRouter } from './routes/index.js';

/**
 * Express uygulamasını üretir.
 *
 * Bu fonksiyon sunucuyu DİNLERMEZ; bu sayede testte veya ileride başka bir
 * bağlamda doğrudan çağrılabilir. Dinleme işi `index.ts` içindedir.
 */
export function createApp(): Express {
  const app = express();

  // "Powered by: Express" başlığı gereksiz bilgi sızdırır.
  app.disable('x-powered-by');

  // JSON gövde limiti. Personel kayıtları küçük olsa da, sınırsız gövde
  // kabul etmek gereksiz bellek tüketimine ve kötüye kullanıma açıktır.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // CORS: yalnızca izin listesindeki origin'lere izin verilir.
  // Geliştirmede frontend Vite proxy üzerinden aynı origin'den geldiği için
  // burası normalde pasif kalır; ayrı dağıtımda (ör. farklı domain) devreye girer.
  app.use(
    cors({
      origin(origin, callback) {
        // Origin yoksa curl, sunucudan sunucuya istek veya aynı origin'li istek.
        if (origin === undefined) {
          callback(null, true);
          return;
        }

        if (env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        // Reddedilen origin sessizce bırakılmaz, loglanır.
        logger.warn('CORS isteği reddedildi', { origin });
        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }),
  );

  app.use(requestLogger);

  // Tüm API yolları tek noktadan bağlanır.
  app.use('/api', apiRouter);

  // Sıralama önemlidir: 404 yakalayıcı route'lardan SONRA, hata işleyici en
  // sonda gelir. Express middleware'ler bu sırayla çalışır.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
