import { Router } from 'express';
import { getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();

/**
 * Oturum ve profil uçları.
 *
 * `requireAuth` her uçta ZORUNLUDUR: bu router'da kimliği olmayan bir
 * isteğin dönebileceği bir uç yoktur. Rol kontrolü (`requireAdmin`) veri
 * yazan uçlarda ayrıca uygulanır; buradaki uç yalnızca kim olduğunu söyler.
 */
authRouter.get('/me', requireAuth, getMe);