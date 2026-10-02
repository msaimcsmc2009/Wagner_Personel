/**
 * `GET /api/health` endpoint'inin yanıt sözleşmesi.
 *
 * Backend'deki karşılığı: backend/src/types/health.ts
 * İki uygulama bağımsız derlendiği için tip monorepo paketi yerine
 * sözleşme olarak iki yerde tanımlanır.
 */
export type DatabaseState = 'not_configured' | 'configured';

export interface HealthStatus {
  status: 'ok';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: DatabaseState;
}
