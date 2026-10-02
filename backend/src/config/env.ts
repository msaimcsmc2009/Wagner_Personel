import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * .env dosyasını Node'un yerleşik yükleyicisiyle okur.
 *
 * Harici bir dotenv paketi kullanılmaz: Node 20+ `process.loadEnvFile()`
 * sunuyor ve dosya yoksa hata fırlattığı için mevcut olup olmadığını
 * `existsSync` ile kontrol ediyoruz.
 *
 * Üretim ortamında bu dosya genellikle bulunmaz; orada değişkenler
 * platform tarafından (Docker, systemd, PaaS) gerçek ortam olarak verilir.
 */
function loadEnvFile(): void {
  const envFilePath = resolve(process.cwd(), '.env');
  if (existsSync(envFilePath)) {
    process.loadEnvFile(envFilePath);
  }
}

loadEnvFile();

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
const NODE_ENVS = ['development', 'test', 'production'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];
export type NodeEnv = (typeof NODE_ENVS)[number];

/** Uygulama ayakta olmak için zorunlu olan değişkenler. */
const REQUIRED_KEYS = ['NODE_ENV', 'PORT', 'HOST', 'CORS_ORIGIN', 'LOG_LEVEL'] as const;

/** Eksik değişkenleri tek seferde, kullanıcıya anlaşılır biçimde bildirir. */
function assertRequiredEnvKeys(): void {
  const missing = REQUIRED_KEYS.filter((key) => {
    const value = process.env[key];
    return value === undefined || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Eksik ortam değişkenleri: ${missing.join(', ')}.\n` +
        'backend/.env.example dosyasını .env olarak kopyalayıp doldurun:\n' +
        '  cp .env.example .env',
    );
  }
}

assertRequiredEnvKeys();

function readString(key: string): string {
  // assertRequiredEnvKeys() çalıştığı için burada değer her zaman var.
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Eksik ortam değişkeni: ${key}`);
  }
  return value.trim();
}

function readOptionalString(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  return value.trim();
}

function readNodeEnv(): NodeEnv {
  const value = readString('NODE_ENV');
  if (!NODE_ENVS.includes(value as NodeEnv)) {
    throw new Error(
      `Geçersiz NODE_ENV değeri: "${value}". Beklenen değerler: ${NODE_ENVS.join(', ')}`,
    );
  }
  return value as NodeEnv;
}

function readLogLevel(): LogLevel {
  const value = readString('LOG_LEVEL');
  if (!LOG_LEVELS.includes(value as LogLevel)) {
    throw new Error(
      `Geçersiz LOG_LEVEL değeri: "${value}". Beklenen değerler: ${LOG_LEVELS.join(', ')}`,
    );
  }
  return value as LogLevel;
}

function readPort(): number {
  const value = readString('PORT');
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Geçersiz PORT değeri: "${value}". 1 ile 65535 arasında bir tam sayı olmalıdır.`,
    );
  }
  return port;
}

function readCorsOrigins(): string[] {
  const origins = readString('CORS_ORIGIN')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error(
      'CORS_ORIGIN en az bir origin içermelidir. Örnek: http://localhost:5173',
    );
  }
  return origins;
}

/**
 * Supabase değişkenleri bu aşamada opsiyoneldir. Şema bir sonraki aşamada
 * tasarlanacağı için bağlantı kurulmamış olabilir; eksiklikte uygulama
 * çalışmaya devam eder, yalnızca veri katmanına erişim hata verir.
 */
function readSupabaseConfig() {
  return {
    url: readOptionalString('SUPABASE_URL'),
    anonKey: readOptionalString('SUPABASE_ANON_KEY'),
    serviceRoleKey: readOptionalString('SUPABASE_SERVICE_ROLE_KEY'),
  } as const;
}

const nodeEnv = readNodeEnv();

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  port: readPort(),
  host: readString('HOST'),
  logLevel: readLogLevel(),
  corsOrigins: readCorsOrigins(),
  supabase: readSupabaseConfig(),
} as const;

export type Env = typeof env;
