/**
 * Kimlik ve profil sözleşmesi — BACKEND tarafı.
 *
 * KAPSAM: bu uygulamada tek tek personel kaydı TUTULMAZ. Burada tanımlanan
 * tipler yalnızca OTURUM AÇAN KULLANICIYI ve rolünü anlatır.
 *
 * SÖZLEŞME KURALI: frontend'de karşılığı `frontend/src/types/auth.ts` içinde
 * bulunan `CurrentUser` ile ALAN ADLARI BİREBİR aynı olmalıdır. İki uygulama
 * bağımsız derlendiği için tip bir monorepo paketi yerine iki yerde yazılır;
 * bu BİLİNÇLİ bir tekrardır ve `types/health.ts` notuyla aynı gerekçeye
 * dayanır.
 */

/** `profiles.role` CHECK kısıtının karşılığı. */
export type UserRole = 'admin' | 'user';

/**
 * `profiles` tablosu satırı (snake_case — veritabanı biçimi).
 *
 * Repository katmanı bu biçimi görür ve domain biçimine (`CurrentUser`)
 * çevirir; servise `*Row` sızmaz.
 */
export interface ProfileRow {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

/**
 * Oturum açan kullanıcının profil bilgisi — API yanıt gövdesi.
 *
 * `role` `null` olabilir: kullanıcının `profiles` satırı yoksa rol bilinmez
 * ve kullanıcı yalnızca okuma yetkisine sahip olur. Bu, "profil eksik"
 * durumunu gizlemek yerine dürüstçe bildirir.
 */
export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole | null;
  /** ISO 8601. Profil satırı yoksa `null`. */
  createdAt: string | null;
}