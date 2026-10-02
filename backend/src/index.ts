import type { Server } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

/** Kapanışta beklenen maksimum süre. Aşılırsa süreç zorla sonlandırılır. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

const server: Server = app.listen(env.port, env.host, () => {
  logger.info('API başlatıldı', {
    url: `http://${env.host}:${env.port}`,
    environment: env.nodeEnv,
    health: `http://${env.host}:${env.port}/api/health`,
  });
});

server.on('error', (error: Error) => {
  logger.error('Sunucu hatası', { message: error.message });
  process.exit(1);
});

let isShuttingDown = false;

function shutdown(reason: string): void {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info('Kapatılıyor', { signal: reason });

  // Açık kalan bağlantılar varsa close() tamamlanmayabilir; bu yüzden bir
  // üst sınır koyuyoruz. Timer unref() ile işlem bitmeden süreci ayakta tutmaz.
  const forceExitTimer = setTimeout(() => {
    logger.error('Kapatma zaman aşımına uğradı, süreç zorla sonlandırılıyor');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  server.close((closeError) => {
    if (closeError !== undefined) {
      logger.error('Sunucu kapatılamadı', { message: closeError.message });
      process.exit(1);
    }

    clearTimeout(forceExitTimer);
    logger.info('Sunucu kapatıldı');
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

// Yakalanmamış hata ve reddedilmiş promise sessizce yutulmaz; loglanıp
// süreç sonlandırılır. Supervisor (nodemon, Docker, systemd) yeniden başlatır.
process.on('uncaughtException', (error: Error) => {
  logger.error('Yakalanmamış hata', { message: error.message, stack: error.stack });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('İşlenmemiş promise reddi', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  shutdown('unhandledRejection');
});
