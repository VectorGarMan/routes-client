import { http, HttpResponse } from 'msw';
import type {
  DeliveryPointRequest,
  DeliveryPointResponse,
  OptimizeRouteRequest,
  RouteResponseDto,
  RouteStopDto,
} from '@/models';

// ─── Estado en memoria del mock ───────────────────────────────────────────────

const points: Record<string, DeliveryPointResponse> = {};
const routes: Record<string, RouteResponseDto> = {};

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function wrap<T>(data: T) {
  return HttpResponse.json({
    success: true,
    message: 'OK',
    data,
    error: null,
  });
}

function errorResponse(code: string, message: string, status: number) {
  return HttpResponse.json(
    {
      success: false,
      message,
      data: null,
      error: { code, details: null },
    },
    { status }
  );
}

// ─── Handlers MSW ─────────────────────────────────────────────────────────────

export const handlers = [
  // POST /api/v1/delivery-points
  http.post('*/api/v1/delivery-points', async ({ request }) => {
    const body = (await request.json()) as DeliveryPointRequest;

    if (!body.reference?.trim()) {
      return errorResponse('INVALID_PAYLOAD', 'La referencia es obligatoria.', 400);
    }
    if (!body.address && body.latitude == null && body.longitude == null) {
      return errorResponse('LOCATION_INVALID', 'La ubicación del punto no es válida.', 400);
    }

    const point: DeliveryPointResponse = {
      id: uuid(),
      reference: body.reference,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      timeWindow: body.timeWindow ?? null,
    };
    points[point.id] = point;
    return HttpResponse.json(
      { success: true, message: 'Punto registrado.', data: point, error: null },
      { status: 201 }
    );
  }),

  // POST /api/v1/routes/optimize
  http.post('*/api/v1/routes/optimize', async ({ request }) => {
    const body = (await request.json()) as OptimizeRouteRequest;

    // Simular 503 si VITE_USE_MOCK_503=true
    if (import.meta.env.VITE_USE_MOCK_503 === 'true') {
      return errorResponse(
        'OPTIMIZATION_SERVICE_UNAVAILABLE',
        'El servicio de optimización no está disponible.',
        503
      );
    }

    if (!body.pointIds || body.pointIds.length < 2) {
      return errorResponse('INVALID_PAYLOAD', 'Se requieren al menos 2 puntos.', 400);
    }
    if (!body.pointIds.includes(body.depotPointId)) {
      return errorResponse('INVALID_PAYLOAD', 'El depósito debe estar en la lista de puntos.', 400);
    }

    const stops: RouteStopDto[] = body.pointIds.map((id, idx) => ({
      pointId: id,
      order: idx,
      status: 'PENDING' as const,
    }));

    let totalDist = 0;
    let totalTime = 0;
    for (let i = 0; i < body.pointIds.length - 1; i++) {
      const a = points[body.pointIds[i]];
      const b = points[body.pointIds[i + 1]];
      if (a?.latitude != null && b?.latitude != null) {
        const dlat = (a.latitude - b.latitude) * 111000;
        const dlng = (a.longitude! - b.longitude!) * 85000;
        const d = Math.sqrt(dlat * dlat + dlng * dlng);
        totalDist += d;
        totalTime += d / 10;
      } else {
        totalDist += 3000 + Math.random() * 2000;
        totalTime += 300 + Math.random() * 200;
      }
    }

    const route: RouteResponseDto = {
      routeId: uuid(),
      status: 'IN_PROGRESS',
      stops,
      totalDistanceMeters: Math.round(totalDist || 8500),
      totalTimeSeconds: Math.round(totalTime || 900),
      updatedAt: new Date().toISOString(),
    };
    routes[route.routeId] = route;
    return wrap(route);
  }),

  // POST /api/v1/routes/:routeId/recalculate
  http.post('*/api/v1/routes/:routeId/recalculate', ({ params }) => {
    const routeId = params.routeId as string;
    const route = routes[routeId];
    if (!route) return errorResponse('ROUTE_NOT_FOUND', 'Ruta no encontrada.', 404);

    const updated: RouteResponseDto = {
      ...route,
      totalDistanceMeters: Math.round(route.totalDistanceMeters * (0.95 + Math.random() * 0.1)),
      totalTimeSeconds: Math.round(route.totalTimeSeconds * (0.95 + Math.random() * 0.1)),
      updatedAt: new Date().toISOString(),
    };
    routes[routeId] = updated;
    return wrap(updated);
  }),

  // POST /api/v1/routes/:routeId/stops/:pointId/visit
  http.post('*/api/v1/routes/:routeId/stops/:pointId/visit', ({ params }) => {
    const routeId = params.routeId as string;
    const pointId = params.pointId as string;
    const route = routes[routeId];
    if (!route) return errorResponse('ROUTE_NOT_FOUND', 'Ruta no encontrada.', 404);

    const sorted = [...route.stops].sort((a, b) => a.order - b.order);
    const targetIdx = sorted.findIndex((s) => s.pointId === pointId);

    if (targetIdx === -1) {
      return errorResponse('POINT_NOT_FOUND', 'Parada no encontrada en la ruta.', 404);
    }

    // Verificar que no haya parada pendiente anterior
    const firstPendingIdx = sorted.findIndex((s) => s.status === 'PENDING');
    if (firstPendingIdx !== -1 && firstPendingIdx < targetIdx) {
      return errorResponse(
        'STOP_OUT_OF_ORDER',
        'Debes marcar primero la parada pendiente anterior.',
        400
      );
    }

    // Marcar visitada (idempotente)
    const updatedStops = route.stops.map((s) =>
      s.pointId === pointId ? { ...s, status: 'VISITED' as const } : s
    );
    const allVisited = updatedStops.every((s) => s.status === 'VISITED');
    const updated: RouteResponseDto = {
      ...route,
      stops: updatedStops,
      status: allVisited ? 'COMPLETED' : 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
    };
    routes[routeId] = updated;
    return wrap(updated);
  }),

  // GET /api/v1/routes/history
  http.get('*/api/v1/routes/history', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '0');
    const size = parseInt(url.searchParams.get('size') ?? '20');
    const all = Object.values(routes).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const start = page * size;
    const content = all.slice(start, start + size);
    return wrap({
      content,
      totalElements: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / size)),
      size,
      number: page,
    });
  }),
];
