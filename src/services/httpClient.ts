import type { ApiResponse } from '@/models';
import { config } from '@/config';

// ─── Error tipado de dominio ──────────────────────────────────────────────────

export class ApiDomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: unknown = null,
    public readonly httpStatus?: number
  ) {
    super(message);
    this.name = 'ApiDomainError';
  }
}

// ─── Mensajes amigables en español ───────────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  LOCATION_INVALID:
    'La ubicación del punto no es válida. Verifica las coordenadas o la dirección.',
  STOP_OUT_OF_ORDER:
    'Debes marcar primero la parada pendiente anterior antes de esta.',
  OPTIMIZATION_SERVICE_UNAVAILABLE:
    'El servicio de optimización no está disponible. Intenta de nuevo más tarde.',
  ROUTE_NOT_FOUND: 'La ruta no fue encontrada.',
  POINT_NOT_FOUND: 'El punto de entrega no fue encontrado.',
  INVALID_PAYLOAD: 'Los datos enviados son inválidos. Revisa el formulario.',
};

function friendlyMessage(code: string, fallback: string, httpStatus?: number): string {
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (httpStatus === 400) return 'Los datos enviados son inválidos.';
  if (httpStatus === 404) return 'El recurso solicitado no fue encontrado.';
  if (httpStatus === 503)
    return 'El servicio de optimización no está disponible en este momento.';
  return fallback || 'Ocurrió un error inesperado.';
}

// ─── Cliente HTTP centralizado ────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    ...options,
  });

  // Intentar parsear como JSON
  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    if (!response.ok) {
      throw new ApiDomainError(
        'NETWORK_ERROR',
        `Error de red (HTTP ${response.status})`,
        null,
        response.status
      );
    }
  }

  if (body === null) {
    throw new ApiDomainError('PARSE_ERROR', 'No se pudo leer la respuesta del servidor.');
  }

  if (!body.success) {
    const code = body.error?.code ?? 'UNKNOWN';
    const msg = friendlyMessage(code, body.message, response.status);
    throw new ApiDomainError(code, msg, body.error?.details, response.status);
  }

  return body.data;
}

export const http = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
};
