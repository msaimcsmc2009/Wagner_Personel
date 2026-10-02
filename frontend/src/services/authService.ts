import { apiClient } from './apiClient';
import type { CurrentUser } from '../types/auth';

/**
 * Oturum açan kullanıcının profilini okur.
 *
 * ⚠ ROLÜN TEK KAYNAĞI BURASI ve backend'deki `GET /api/auth/me`.
 *
 * Rol daha önce tarayıcıdan doğrudan `profiles` tablosuna sorularak
 * çözülüyordu. İki sorumluluk iki yere bölünmüştü ve ikisi de sessizce
 * bozuldu: yetki hatası `role: null` olarak yorumlanıyor, kullanıcı
 * admin-only bir ekrana tıklayınca dashboard'a geri yönlendiriliyor ve
 * nedenini kimse göremiyordu.
 *
 * Artık kural nettir:
 *   - `supabase-js` yalnızca KİMLİK doğrulama içindir (giriş, oturum, token).
 *   - Veri ve ROL daima backend API üzerinden gelir.
 * Böylece `service_role` anahtarı tarayıcıya sızmaz ve RLS politikaları
 * tek yerde doğru yazılır.
 */
export function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  return apiClient.get<CurrentUser>('/auth/me', signal);
}