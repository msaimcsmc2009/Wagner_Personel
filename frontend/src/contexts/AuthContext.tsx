import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { fetchCurrentUser } from '../services/authService';
import { ApiError } from '../services/apiClient';
import type { AuthState, UserProfile } from '../types/auth';

/**
 * Oturum ve kullanıcı profili.
 *
 * İKİ AYRI SORUMLULUK, İKİ AYRI KAYNAK:
 *   1. "Kim giriş yapmış?" → Supabase Auth (`session`).
 *   2. "Bu kişi kimdir, yetkisi ne?" → backend `GET /api/auth/me` (`user`).
 *
 * ⚠ Rol tarayıcıdan veritabanına sorularak ÇÖZÜLMEZ. Daha önce öyle
 *   yapıyordu ve iki sonuç doğurdu: (a) rol bilgisi için tarayıra tablo
 *   erişimi açılması gerekti, (b) yetki hatası `role: null` sanılıp
 *   kullanıcı sessizce "yönetici değil" muamelesi gördü. Artık tek kaynak
 *   backend'dir.
 *
 * ⚠ Profil alınamazsa kullanıcı OTURUMDAN ÇIKARILMAZ. Backend'e ulaşılamadığı
 *   ya da migration eksik olduğu için kullanıcıyı çıkarmak, sorunu gizler
 *   ve "verilerim gitti" izlenimi yaratır. Bunun yerine rol `null` kalır ve
 *   `profileError` mesajı arayüzde gösterilir.
 */
interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  /**
   * Profil isteğinin iptali.
   *
   * `fetch` içinde `AbortSignal` kullanılır: sağlayıcı değiştiğinde eski
   * isteğin geç gelen yanıtı yeni kullanıcının profilini ezmesin.
   */
  const profileAbortRef = useRef<AbortController | null>(null);

  /**
   * Profili başarıyla okunan son kullanıcı.
   *
   * Supabase oturum açılışında hem `INITIAL_SESSION` hem `SIGNED_IN`
   * olayı gönderebilir. Aynı kullanıcı için ikinci kez istek atmak hem
   * gereksiz hem de "hangi yanıt geçerli" belirsizliği üretir. Bu
   * karşılaştırma tekrarları keser.
   *
   * ⚠ Yalnızca BAŞARILI yanıttan sonra yazılır. Başarısız bir istekte
   *   kullanıcı doğrudan buraya bakıp yeniden denerse yeniden denemelidir.
   */
  const loadedUserIdRef = useRef<string | null>(null);

  /**
   * Profili backend'den okur. Hata olursa kullanıcıyı düşürmez, yalnızca
   * rolü bilinmeyen olarak bırakır ve sebebi kaydeder.
   */
  const loadProfile = useCallback(
    async (activeSession: Session | null, force = false) => {
      profileAbortRef.current?.abort();

      if (activeSession === null) {
        profileAbortRef.current = null;
        loadedUserIdRef.current = null;
        setUser(null);
        setProfileError(null);
        return;
      }

      if (!force && loadedUserIdRef.current === activeSession.user.id) return;

      const controller = new AbortController();
      profileAbortRef.current = controller;

      try {
        const profile = await fetchCurrentUser(controller.signal);
        loadedUserIdRef.current = profile.id;
        setUser(profile);
        setProfileError(null);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        setUser({
          id: activeSession.user.id,
          email: activeSession.user.email ?? null,
          fullName: null,
          role: null,
          createdAt: null,
        });

        setProfileError(
          error instanceof ApiError
            ? error.message
            : 'Kullanıcı bilgileri alınamadı. Yönetici özellikleri kullanılamıyor.',
        );
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      setSession(data.session);
      await loadProfile(data.session);
      if (active) setLoading(false);
    };

    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      /*
       * `onAuthStateChange` içinde ASILDEKİZMANLI Supabase çağrısı yapılmaz;
       * kütüphane bunu özellikle öneri şeklinde yasaklar (kilitlenme riski).
       * Buradaki iş bir `fetch` olduğu için risk düşük, yine de iş bir
       * sonraki görevde başlatılır ve React state güncellemeleri güvenli
       * tarafta kalır.
       */
      setTimeout(() => {
        setSession(nextSession);
        setLoading(true);
        void loadProfile(nextSession).finally(() => {
          setLoading(false);
        });
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      profileAbortRef.current?.abort();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error !== null) {
        setLoading(false);
        throw error;
      }

      /*
        Profil burada, doğrudan yüklenir.
        `SIGNED_IN` olayına bırakılırsa yükleme ekranının ne zaman kapanacağı
        kütüphanenin olay zamanlamasına bağlı olur; olay gecikirse ya da
        hiç gelmezse kullanıcı "Yükleniyor…" ekranında kalır.
      */
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    profileAbortRef.current?.abort();
    profileAbortRef.current = null;
    loadedUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setProfileError(null);
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadProfile(data.session, true);
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      profileError,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      signIn,
      signOut,
      refreshProfile,
    }),
    [user, session, loading, profileError, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}