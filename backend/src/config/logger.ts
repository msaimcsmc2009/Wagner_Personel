import { env } from './env.js';
import type { LogLevel } from './env.js';

/** Log seviyeleri için sayısal ağırlık; düşük olan loglanır. */
const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const threshold = LEVEL_WEIGHT[env.logLevel];

type LogContext = Record<string, unknown>;

/**
 * Bağımlılıksız, yapılandırılmış JSON logger.
 *
 * Üretimde log toplayıcısına (ör. Loki, CloudWatch) satır satır gönderilebilir
 * olması için JSON biçimi kullanılır. Hata mesajları asla yutulmaz; her
 * hata `error` seviyesine yazılır.
 */
function write(level: LogLevel, message: string, context?: LogContext): void {
  if (LEVEL_WEIGHT[level] < threshold) {
    return;
  }

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...context,
  };

  const line = JSON.stringify(entry);

  if (level === 'error' || level === 'warn') {
    console.error(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext): void => write('debug', message, context),
  info: (message: string, context?: LogContext): void => write('info', message, context),
  warn: (message: string, context?: LogContext): void => write('warn', message, context),
  error: (message: string, context?: LogContext): void => write('error', message, context),
} as const;
