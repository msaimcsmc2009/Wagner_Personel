import type { RequestHandler } from 'express';
import { getCurrentUser } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';

/**
 * GET /api/auth/me
 *
 * Oturum açan kullanıcının profilini döner.
 *
 * Başarılı yanıt:
 *   200 { "id", "email", "fullName", "role", "createdAt" }
 *
 * ⚠ NEDEN VAR: frontend rolü tarayıcıdan veritabanına sorarak öğreniyordu.
 *   Bu iki sorumluluğu bölüyordu ve ikisi de grant eksikliğiyle sessizce
 *   bozuldu (rol hep `null` → admin-only ekranlar dashboard'a geri yönlendi).
 *   Artık rol tek yerden, backend'den gelir; tarayıcı hiçbir tabloya
 *   doğrudan bağlanmaz.
 */
export const getMe: RequestHandler = async (req, res) => {
  const identity = req.user;

  if (identity === undefined) {
    // `requireAuth` her zaman `req.user` yazar; buraya düşmek sözleşme ihlali
    // demektir ve sessizce geçilmez.
    throw new AppError(401, 'unauthorized', 'Unauthorized');
  }

  const user = await getCurrentUser({ id: identity.id, email: identity.email });

  res.status(200).json(user);
};