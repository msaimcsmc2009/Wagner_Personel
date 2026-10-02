/**
 * `GET /api/health` yanıtının sözleşmesi.
 *
 * Frontend bu tipi `frontend/src/types/health.ts` içinde birebir tekrar eder.
 * İki uygulama birbirinden bağımsız derlendiği için tip paylaşımı bilinçli
 * olarak monorepo paketi yerine sözleşme olarak tutulur.
 */
export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: 'not_configured' | 'configured';
}
