/**
 * API'ye giden tüm isteklerin tek noktadan geçtiği istemci.
 *
 * Backend'in hata gövdesiyle ({ status: 'error', code, message }) birebir
 * eşleşen bir hata tipi üretir. Hatalar SESSİZCE YUTULMAZ: her hata ya
 * başarıyla döner ya da `ApiError` fırlatır. Çağıran taraf hata durumunu
 * açıkça ele almak zorundadır.
 */

import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Sunucu yanıt vermezse isteği bu süre sonunda iptal ederiz. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Backend'in hata gövdesi. */
interface ApiErrorBody {
  status?: 'error';
  code?: string;
  message?: string;
  details?: unknown;
}

/**
 * Tüm API hataları bu sınıftan gelir. `status` 0 ise istek sunucuya hiç
 * ulaşmamıştır (ağ hatası veya zaman aşımı).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Sunucuya ulaşılamadıysa true. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // Zaman aşımı için iptal sinyali. Çağıranın kendi sinyali varsa
  // ikisi birlikte dinlenir (bileşen unmount olurken istek iptal edilir).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  if (init.signal !== null && init.signal !== undefined) {
    init.signal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    };

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token !== undefined && token.length > 0) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }

    if (init.headers !== undefined) {
      const h = init.headers as Record<string, string | readonly string[]>;
      for (const k of Object.keys(h)) {
        const v = h[k];
        if (typeof v === 'string') {
          headers[k] = v;
        } else if (Array.isArray(v)) {
          headers[k] = v.join(', ');
        }
      }
    }

    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers,
    });

    const rawBody = await response.text();

    let parsedBody: unknown = null;
    if (rawBody.trim() !== '') {
      try {
        parsedBody = JSON.parse(rawBody) as unknown;
      } catch {
        // JSON değilse ham metni koruruz; hata mesajında kullanıcıya
        // ne döndüğünü göstermek için gerekebilir.
        parsedBody = rawBody;
      }
    }

    if (!response.ok) {
      const body = isApiErrorBody(parsedBody) ? parsedBody : null;
      const code = body?.code ?? `HTTP_${response.status}`;
      const message =
        body?.message ??
        `Sunucu isteği başarıyla tamamlayamadı (HTTP ${response.status}).`;

      throw new ApiError(response.status, code, message, parsedBody);
    }

    return parsedBody as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        0,
        'REQUEST_TIMEOUT',
        'Sunucu zamanında yanıt vermedi. Lütfen tekrar deneyin.',
      );
    }

    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Sunucuya ulaşılamadı. Backend çalışıyor mu?',
      error,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal): Promise<T> =>
    request<T>(path, signal !== undefined ? { method: 'GET', signal } : { method: 'GET' }),

  /**
   * Kısmi güncelleme.
   *
   * Gövde JSON olarak serileştirilir. `PUT`/`PATCH` sunucuda bir kaydın bir
   * alanını değiştirdiği için kullanılır; bu API'de `PATCH /staff-counts`
   * tek bir kategorinin sayısını günceller.
   *
   * Yetki backend'de denetlenir (`requireAuth` + `requireAdmin`); istemci
   * yalnızca oturum tokenını ekler. Kullanıcının yetkisi arayüzde gizlenmez,
   * ekranda dürüstçe gösterilir.
   */
  patch: <T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>(
      path,
      signal !== undefined
        ? { method: 'PATCH', body: JSON.stringify(body), signal }
        : { method: 'PATCH', body: JSON.stringify(body) },
    ),
} as const;
