import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from './logger.js';

/**
 * Supabase istemcisi yalnızca ilk kullanıldığında oluşturulur (lazy singleton).
 *
 * Böylece veritabanı yapılandırılmamış olsa bile backend ayağa kalkar ve
 * /apihealth gibi temel endpoint'ler çalışır. Bağlantı kurulduğunda
 * yapılandırmanın eksik olduğu açık bir hata mesajıyla bildirilir.
 */
let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const { url, serviceRoleKey } = env.supabase;
  return url !== undefined && serviceRoleKey !== undefined;
}

/**
 * Backend yalnızca sunucu anahtarıyla çalışır. RLS (Row Level Security)
 * kurallarını atlatabilen service_role key'i ASLA frontend'e sızmamalıdır.
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient !== null) {
    return cachedClient;
  }

  const { url, serviceRoleKey } = env.supabase;

  if (url === undefined || serviceRoleKey === undefined) {
    throw new AppError(
      503,
      'SUPABASE_NOT_CONFIGURED',
      'Supabase bağlantısı yapılandırılmamış. ' +
        'backend/.env dosyasına SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY değerlerini ekleyin.',
    );
  }

  logger.info('Supabase istemcisi oluşturuluyor', { url });

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: 'public' },
  });

  return cachedClient;
}
