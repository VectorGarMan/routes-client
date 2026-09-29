import { http, HttpResponse } from 'msw';
import type {
  DeliveryPointRequest,
  DeliveryPointResponse,
  OptimizeRouteRequest,
  RouteResponseDto,
  RouteStopDto,
} from '@/models';

/**
 * Mocks MSW que imitan el comportamiento REAL del backend Spring (routes-api):
 * mismos estados de ruta (ACTIVE/COMPLETED), mismos códigos de error
 * (VALIDATION_ERROR, LOCATION_INVALID, OPTIMIZER_UNAVAILABLE...), mismos
 * mensajes y el historial como arreglo plano. Si el backend cambia, actualizar aquí.
 */

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

// El backend responde 400 VALIDATION_ERROR (no 404) para ids inexistentes.
function validationError(message: string) {
  return errorResponse('VALIDATION_ERROR', message, 400);
}

// ─── Handlers MSW ─────────────────────────────────────────────────────────────

export const handlers = [
  // POST /api/v1/delivery-points
  http.post('*/api/v1/delivery-points', async ({ request }) => {
    const body = (await request.json()) as DeliveryPointRequest;

    if (!body.reference?.trim()) {
      return validationError('Datos inválidos');
    }
    if (!body.address?.trim() && (body.latitude == null || body.longitude == null)) {
      return validationError('Se requiere address o latitude/longitude');
    }
    // Atajo para probar FE-006 en modo mock: una dirección que contenga "invalida"
    // simula una ubicación que Mapbox no reconoce (el backend responde 422).
    if (body.address?.toLowerCase().includes('invalida')) {
      return errorResponse('LOCATION_INVALID', 'La ubicación no pudo ser validada', 422);
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
      { success: true, message: 'Punto de entrega registrado', data: point, error: null },
      { status: 201 }
    );
  }),

  // POST /api/v1/routes/optimize
  http.post('*/api/v1/routes/optimize', async ({ request }) => {
    const body = (await request.json()) as OptimizeRouteRequest;

    // Simular 503 si VITE_USE_MOCK_503=true
    if (import.meta.env.VITE_USE_MOCK_503 === 'true') {
      return errorResponse(
        'OPTIMIZER_UNAVAILABLE',
        'El servicio de optimización no está disponible',
        503
      );
    }

    if (!body.pointIds || body.pointIds.length === 0) {
      return validationError('Datos inválidos');
    }
    if (!body.pointIds.includes(body.depotPointId)) {
      return validationError('depotPointId debe estar incluido en pointIds');
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
      status: 'ACTIVE',
      stops,
      totalDistanceMeters: Math.round(totalDist || 8500),
      totalTimeSeconds: Math.round(totalTime || 900),
      routeGeometry: null,
      updatedAt: new Date().toISOString(),
    };
    routes[route.routeId] = route;
    return wrap(route);
  }),

  // POST /api/v1/routes/:routeId/recalculate
  http.post('*/api/v1/routes/:routeId/recalculate', ({ params }) => {
    const routeId = params.routeId as string;
    const route = routes[routeId];
    if (!route) return validationError('routeId no existe');

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
    if (!route) return validationError('routeId no existe');

    const sorted = [...route.stops].sort((a, b) => a.order - b.order);
    const target = sorted.find((s) => s.pointId === pointId);
    if (!target) return validationError('pointId no forma parte de esta ruta');

    // Idempotente: marcar una parada ya visitada no es un error.
    if (target.status === 'VISITED') return wrap(route);

    // Solo se puede marcar la primera parada pendiente (el backend responde
    // VALIDATION_ERROR con este mensaje, no un código propio).
    const nextPending = sorted.find((s) => s.status === 'PENDING');
    if (nextPending && nextPending.pointId !== pointId) {
      return validationError(
        `Debe marcarse primero la parada pendiente con order=${nextPending.order}`
      );
    }

    const updatedStops = route.stops.map((s) =>
      s.pointId === pointId ? { ...s, status: 'VISITED' as const } : s
    );
    const allVisited = updatedStops.every((s) => s.status === 'VISITED');
    const updated: RouteResponseDto = {
      ...route,
      stops: updatedStops,
      status: allVisited ? 'COMPLETED' : 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };
    routes[routeId] = updated;
    return wrap(updated);
  }),

  // GET /api/v1/routes/history  -> arreglo plano, sin metadatos de paginación
  http.get('*/api/v1/routes/history', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '0');
    const size = parseInt(url.searchParams.get('size') ?? '20');
    const all = Object.values(routes).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const start = page * size;
    return wrap(all.slice(start, start + size));
  }),
];
