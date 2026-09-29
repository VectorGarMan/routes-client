import type { DeliveryPointResponse, RouteResponseDto } from '@/models';

/**
 * Persistencia de la ruta activa en localStorage: recargar la página (común en
 * celulares) no debe hacer perder el routeId ni los datos de las paradas.
 * Si el almacenamiento no está disponible, la app sigue funcionando sin persistir.
 */

const STORAGE_KEY = 'routes-app:active-session';

export interface ActiveSession {
  route: RouteResponseDto;
  pointsById: Record<string, DeliveryPointResponse>;
  depotPointId: string;
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // almacenamiento no disponible (modo privado, bloqueado): se ignora
  }
}

/** Una ruta COMPLETED ya no se restaura: se borra en lugar de guardarse. */
export function saveActiveSession(session: ActiveSession): void {
  if (session.route.status === 'COMPLETED') {
    clearActiveSession();
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // cuota excedida o almacenamiento bloqueado: se ignora
  }
}

export function loadActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ActiveSession> | null;
    if (
      !parsed?.route?.routeId ||
      !Array.isArray(parsed.route.stops) ||
      parsed.route.status === 'COMPLETED' ||
      typeof parsed.pointsById !== 'object' ||
      parsed.pointsById === null ||
      typeof parsed.depotPointId !== 'string'
    ) {
      return null;
    }
    return parsed as ActiveSession;
  } catch {
    return null;
  }
}
