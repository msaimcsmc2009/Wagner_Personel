import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { getSupabaseClient } from '../config/supabase.js';
import { logger } from '../config/logger.js';

export interface AuthUser {
  id: string;
  email: string | null;
  role?: 'admin' | 'user' | null;
  fullName?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('authorization') ?? req.header('Authorization');
    if (authHeader === undefined || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401,'unauthorized','Unauthorized');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (token.length === 0) {
      throw new AppError(401,'unauthorized','Unauthorized');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error !== null) {
      logger.warn('auth.getUser failed', { err: error.message });
      throw new AppError(401,'unauthorized','Unauthorized');
    }

    const authUser = data.user;
    if (authUser === null) {
      throw new AppError(401,'unauthorized','Unauthorized');
    }

    let role: AuthUser['role'] = null;
    let fullName: string | null = null;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', authUser.id)
        .maybeSingle();

      /*
       * Sorgu hatası YUTULMAZ.
       *
       * Grant eksikliği (`42501`) veya migration eksikliği (`42P01`) rolün
       * `null` kalmasına ve kullanıcının sessizce "yönetici değil" muamelesi
       * görmesine yol açıyordu: kullanıcı admin idiyse bile admin-only
       * uçlardan 403 alıyor, sebebi kimse bilmiyordu.
       *
       * Hata loglanır, istek yine de sürer. Çünkü bu bir YANITLAMA hatası
       * değil, KURULUM hatasıdır: oturum açmış kullanıcıya 401/500 dönmek
       * doğru değildir. Yalnızca rol atanır ve `requireAdmin` 403 döner —
       * artık sebebi logda bellidir.
       */
      if (error !== null) {
        logger.error('profiles sorgusu başarısız; rol atanmadı', {
          code: error.code,
          message: error.message,
          userId: authUser.id,
        });
      }

      role = (profile?.role as AuthUser['role']) ?? null;
      fullName = profile?.full_name ?? null;
    } catch (err) {
      logger.error('profiles sorgusu istisna attı; rol atanmadı', {
        err: err instanceof Error ? err.message : String(err),
        userId: authUser.id,
      });
    }

    req.user = {
      id: authUser.id,
      email: authUser.email ?? null,
      role,
      fullName,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user === undefined) {
    return next(new AppError(401,'unauthorized','Unauthorized'));
  }

  if (req.user.role !== 'admin') {
    /*
     * Kullanıcıya İngilizce ve anlamsız bir 403 gönderilmez.
     *
     * `Forbidden` yerine mesaj verilir çünkü istemci bu gövdeyi kullanıcıya
     * gösterir: "Bu işlem için yönetici yetkisi gerekiyor" ne olduğunu
     * söyler, `Forbidden` yalnızca HTTP dünyasında anlamlıdır.
     */
    return next(
      new AppError(
        403,
        'forbidden',
        'Bu işlemi gerçekleştirmek için yönetici yetkisi gerekiyor.',
      ),
    );
  }

  next();
}
