import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

/** API'nin hata durumunda döndürdüğü gövde. */
interface ErrorBody {
  status: 'error';
  code: string;
  message: string;
  details?: unknown;
  /** Yalnızca geliştirme ortamında döner; üretimde asla gönderilmez. */
  stack?: string;
}

/** Var olmayan bir route'a yapılan istekleri 404'e çevirir. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError(
      404,
      'NOT_FOUND',
      `Endpoint bulunamadı: ${req.method} ${req.originalUrl}`,
    ),
  );
};

/**
 * Tüm hataları tek bir JSON biçimine indirger.
 *
 * - Beklenen hatalar (AppError) kullanıcıya anlaşılır mesajla döner.
 * - Beklenmeyen hataların iç detayı istemciye SIZDIRILMAZ; yalnızca loglanır
 *   ve kullanıcıya nötr bir mesaj gösterilir.
 * - `stack` yalnızca geliştirme ortamında dahil edilir.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isAppError
    ? err.message
    : 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';

  const context = {
    code,
    statusCode,
    cause: err instanceof Error ? err.message : String(err),
  };

  if (statusCode >= 500) {
    logger.error(message, context);
  } else {
    logger.warn(message, context);
  }

  const body: ErrorBody = {
    status: 'error',
    code,
    message,
  };

  if (isAppError && err.details !== undefined) {
    body.details = err.details;
  }

  if (!env.isProduction && err instanceof Error && err.stack !== undefined) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
