import type { RequestHandler } from 'express';
import { logger } from '../config/logger.js';

/**
 * Her istek için tek satırlık erişim logu.
 *
 * Sağlık kontrolü (`/api/health`) loglanmaz: geliştirme sırasında saniyede
 * birçok kez çağrılır ve gerçek hataları gizler.
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  if (req.path === '/api/health') {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info('İstek tamamlandı', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
};
