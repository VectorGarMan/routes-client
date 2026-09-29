import { http } from './httpClient';
import type {
  OptimizeRouteRequest,
  RouteResponseDto,
  PageResponse,
} from '@/models';

export const routeService = {
  /**
   * Calcula la ruta óptima.
   * POST /api/v1/routes/optimize
   */
  optimize(payload: OptimizeRouteRequest): Promise<RouteResponseDto> {
    return http.post<RouteResponseDto>('/api/v1/routes/optimize', payload);
  },

  /**
   * Recalcula la ruta por tráfico (polling).
   * POST /api/v1/routes/{routeId}/recalculate
   */
  recalculate(routeId: string): Promise<RouteResponseDto> {
    return http.post<RouteResponseDto>(`/api/v1/routes/${routeId}/recalculate`);
  },

  /**
   * Marca una parada como visitada.
   * POST /api/v1/routes/{routeId}/stops/{pointId}/visit
   */
  markVisited(routeId: string, pointId: string): Promise<RouteResponseDto> {
    return http.post<RouteResponseDto>(
      `/api/v1/routes/${routeId}/stops/${pointId}/visit`
    );
  },

  /**
   * Obtiene el historial de rutas paginado.
   * GET /api/v1/routes/history?page=0&size=20
   */
  getHistory(page = 0, size = 20): Promise<PageResponse<RouteResponseDto>> {
    return http.get<PageResponse<RouteResponseDto>>(
      `/api/v1/routes/history?page=${page}&size=${size}`
    );
  },
};
