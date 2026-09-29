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

// Códigos estables del backend (ErrorCode). VALIDATION_ERROR no va aquí a propósito:
// el backend envía un mensaje específico en español y se muestra tal cual.
const ERROR_MESSAGES: Record<string, string> = {
  LOCATION_INVALID:
    'La ubicación del punto no es válida. Verifica las coordenadas o la dirección.',
  MAPS_UNAVAILABLE:
    'El servicio de mapas no está disponible. Intenta de nuevo en unos minutos.',
  MAPS_RATE_LIMIT:
    'Se alcanzó el límite de consultas al servicio de mapas. Espera un momento e intenta de nuevo.',
  ROUTE_INFEASIBLE:
    'No se encontró una ruta viable con los puntos y restricciones indicados.',
  OPTIMIZER_UNAVAILABLE:
    'El servicio de optimización no está disponible. Intenta de nuevo más tarde.',
};

function friendlyMessage(code: string, fallback: string, httpStatus?: number): string {
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  // Ej.: "Debe marcarse primero la parada pendiente con order=2".
  if (code === 'VALIDATION_ERROR' && fallback) return fallback;
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
