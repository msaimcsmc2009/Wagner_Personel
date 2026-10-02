import { env } from '../config/env.js';
import { isSupabaseConfigured } from '../config/supabase.js';
import type { HealthResponse } from '../types/health.js';

const SERVICE_NAME = 'wagner-kablo-personel-api';

function readVersion(): string {
  // npm, çalıştırılan her script için npm_package_version değerini enjekte eder.
  // Doğrudan `node dist/index.js` ile çalıştırılırsa fallback devreye girer.
  return process.env['npm_package_version'] ?? '0.0.0';
}

/**
 * Servisin ayakta olduğunu doğrulayan hafif bir sağlık kontrolü.
 *
 * Bu aşamada veritabanına sorgu atılmaz: Supabase tabloları henüz yok.
 * Yalnızca yapılandırmanın yüklü olup olmadığı bildirilir. Gerçek bağlantı
 * testi, şema oluşturulduktan sonra ayrı bir `checks` alanı olarak
 * genişletilecektir.
 */
export function getHealthStatus(): HealthResponse {
  return {
    status: 'ok',
    service: SERVICE_NAME,
    version: readVersion(),
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: isSupabaseConfigured() ? 'configured' : 'not_configured',
  };
}
