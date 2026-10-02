import { findProfileById } from '../repositories/profile.repository.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import type { CurrentUser, UserRole } from '../types/auth.js';

/**
 * Oturum açan kullanıcının profil bilgisi.
 *
 * ROLÜN TEK KAYNAĞI. Frontend de, istek başındaki `requireAuth` de bu
 * servisi çağırır. Rol birden fazla yerde ayrı ayrı çözülürse biri grant
 * eksikliğiyle sessizce bozulur ve kullanıcı anlamadığı bir şekilde
 * yetkisini kaybeder.
 */

export interface AuthenticatedIdentity {
  id: string;
  email: string | null;
}

/**
 * `auth.users` kimliğinden uygulama profilini üretir.
 *
 * ⚠ PROFİL SATIRI YOKSA HATA FIRLATILMAZ. `handle_new_user` trigger'ı
 *   yeni kullanıcılara profil açıyor; yine de migration'dan önce açılmış
 *   bir oturumda satır bulunmayabilir. Bu durumda kullanıcıya rol YOK verilir
 *   (en az yetki ilkesi) ve ekranlarda yalnızca okuma hakkı tanınır. Böylece
 *   uygulama erişilebilir kalır, veri katmanı ise sessizce "yönetici" demez.
 */
export async function getCurrentUser(identity: AuthenticatedIdentity): Promise<CurrentUser> {
  if (identity.id.trim().length === 0) {
    throw new AppError(401, 'unauthorized', 'Unauthorized');
  }

  const profile = await findProfileById(identity.id);

  if (profile === null) {
    logger.warn('profiles satırı bulunamadı; rol atanmadı', { userId: identity.id });

    return {
      id: identity.id,
      email: identity.email,
      fullName: null,
      role: null,
      createdAt: null,
    };
  }

  return {
    id: profile.id,
    email: identity.email,
    fullName: profile.full_name,
    role: profile.role as UserRole,
    createdAt: profile.created_at,
  };
}