import type { UserProfile, UserRole } from '../types/auth';

/**
 * Kullanıcı görünen adı ve rol etiketi.
 *
 * ⚠ NEDEN YARDIMCI: kenar çubuğu ile üst çubuk aynı bilgiyi gösterir
 *   (avatar + ad + rol). İkisi ayrı ayrı hesaplarsa biri gerçek oturumu
 *   kullanırken diğeri eski bir sabit isim göstermeye devam eder — bu,
 *   "hangi hesapla giriş yaptım" sorusunu ekranda cevaplanamaz hâle
 *   getirir. Tek kural, tek yer.
 *
 * KAYNAK: `AuthContext.user`, yani backend `GET /api/auth/me`. Daha önce
 * `navigation.tsx` içinde SABİT bir kullanıcı vardı ve kim giriş yaparsa
 * yapısın adı "Serkan Aydın" görünüyordu.
 */

/** Profil dolmadan gösterilecek nötr ad. */
export const USER_NAME_FALLBACK = 'Kullanıcı';

/**
 * Görünen ad.
 *
 * Sıra: profil adı → e-posta → nötr yedek.
 *
 * ⚠ Avatar baş harf üretir; boş ad avatarı boş bırakır. Bu yüzden hiçbir
 *   zaman boş metin dönmez.
 */
export function userDisplayName(user: UserProfile | null): string {
  if (user === null) return USER_NAME_FALLBACK;

  const name = user.fullName?.trim();
  if (name !== undefined && name.length > 0) return name;

  const email = user.email?.trim();
  if (email !== undefined && email.length > 0) return email;

  return USER_NAME_FALLBACK;
}

/** Avatar baş harfi: "Serkan Aydın" → "S", "aydin@…" → "a". */
export function userInitials(user: UserProfile | null): string {
  return userDisplayName(user).charAt(0);
}

/**
 * Rol etiketi.
 *
 * `null` rol, "bilinmiyor" demektir ve bilinçli olarak ayrı bir metin alır:
 * `user` yazmak, sistemde öyle bir rol olmadığını uydurur.
 */
export function userRoleLabel(role: UserRole | null | undefined): string {
  if (role === 'admin') return 'Yönetici';
  if (role === 'user') return 'Kullanıcı';
  return 'Rol bilgisi yok';
}