import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import staffCountRouter from './staffCount.routes.js';

/**
 * API yönlendiricilerinin tek giriş noktası.
 *
 * Yeni modüller burada kendi router'ıyla bağlanır. Route tanımları
 * controller'lara, controller'lar service'lere devreder; controller doğrudan
 * veri katmanına dokunmaz.
 *
 * Bu API'nin kapsamı YALNIZCA personel sayısıdır (Üretim / Endirekt).
 * Personel kaydı, departman, izin veya eğitim endpoint'i BULUNMAZ ve
 * bilinçli olarak eklenmeyecektir.
 */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/staff-counts', staffCountRouter);
