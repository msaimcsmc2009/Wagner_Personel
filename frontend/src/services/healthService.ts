import { apiClient } from './apiClient';
import type { HealthStatus } from '../types/health';

/**
 * Backend'in sağlık durumunu sorgular.
 *
 * Geliştirme ortamında istekler Vite proxy üzerinden aynı origin'den
 * gider; bu nedenle tarayıcı tarafında CORS'a gerek kalmaz.
 */
export function fetchHealthStatus(signal?: AbortSignal): Promise<HealthStatus> {
  return apiClient.get<HealthStatus>('/health', signal);
}
