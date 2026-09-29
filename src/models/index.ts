/**
 * FE-002: Modelos TypeScript que espejean exactamente los DTO de Spring Boot.
 * Ningún campo extra, ningún alias.
 */

// ─── Ventana de tiempo ────────────────────────────────────────────────────────

export interface TimeWindowDto {
  start: string; // ISO-8601 con offset, ej. "2024-01-15T09:00:00-06:00"
  end: string;   // ISO-8601 con offset
}

// ─── Puntos de entrega ────────────────────────────────────────────────────────

export interface DeliveryPointRequest {
  reference: string;       // obligatorio, no vacío
  address?: string;
  latitude?: number;       // -90..90
  longitude?: number;      // -180..180
  timeWindow?: TimeWindowDto;
}

export interface DeliveryPointResponse {
  id: string;              // UUID
  reference: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  timeWindow: TimeWindowDto | null;
}

// ─── Rutas ────────────────────────────────────────────────────────────────────

export type RouteObjective = 'DISTANCE' | 'TIME';

export interface OptimizeRouteRequest {
  pointIds: string[];       // mínimo 2, incluye el depósito
  objective: RouteObjective;
  depotPointId: string;     // debe estar en pointIds
}

export type StopStatus = 'PENDING' | 'VISITED';

export interface RouteStopDto {
  pointId: string;          // UUID
  order: number;            // 0 = depósito
  status: StopStatus;
}

// Estados reales del backend (CTR-001): ACTIVE = ruta calculada y en curso.
export type RouteStatus = 'CALCULATING' | 'ACTIVE' | 'COMPLETED' | 'ERROR';

export interface RouteResponseDto {
  routeId: string;          // UUID
  status: RouteStatus;
  stops: RouteStopDto[];
  totalDistanceMeters: number;
  totalTimeSeconds: number;
  updatedAt: string;        // ISO-8601
}

// ─── Wrapper genérico de API ──────────────────────────────────────────────────

export interface ApiError {
  code: string;
  details: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: ApiError | null;
}
