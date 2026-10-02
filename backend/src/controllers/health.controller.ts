import type { RequestHandler } from 'express';
import { getHealthStatus } from '../services/health.service.js';

/**
 * GET /api/health
 *
 * Başarılı yanıt:
 *   200 { "status": "ok", ... }
 */
export const healthController: RequestHandler = (_req, res) => {
  res.status(200).json(getHealthStatus());
};
