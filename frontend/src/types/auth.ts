export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole | null;
  createdAt: string | null;
}

/**
 * `GET /api/auth/me` yanıt gövdesi — backend sözleşmesinin birebir kopyası.
 *
 * ⚠ SÖZLEŞME KURALI: bu arayüz backend'deki `CurrentUser`
 *   (`backend/src/types/auth.ts`) ile ALAN ADLARI BİREBİR aynı olmalıdır.
 *   İki uygulama bağımsız derlendiği için tip bir monorepo paketi yerine iki
 *   yerde yazılır; ayrışma sessizce bozuk ekrana dönüşür.
 *
 * ⚠ `role` `null` olabilir ve O ZAMAN HESAP DA YANLIŞTIR: kullanıcının
 *   `profiles` satırı yoksa rol bilinmez ve yalnızca okuma hakkı vardır.
 *   `null`, `user` demek DEĞİLDİR — ikisi farklıdır ve ayrım korunur.
 */
export type CurrentUser = UserProfile;

export interface AuthState {
  user: UserProfile | null;
  session: unknown | null;
  loading: boolean;
  /** Profil bilgisi alınırken hata oluştu mu. `user` yine de gösterilir. */
  profileError: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}