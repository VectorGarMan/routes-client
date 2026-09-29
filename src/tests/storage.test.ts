import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  type ActiveSession,
} from '@/utils/storage';

const KEY = 'routes-app:active-session';

const session: ActiveSession = {
  route: {
    routeId: 'r1',
    status: 'ACTIVE',
    stops: [{ pointId: 'a', order: 0, status: 'PENDING' }],
    totalDistanceMeters: 1000,
    totalTimeSeconds: 300,
    routeGeometry: null,
    updatedAt: '2026-01-01T00:00:00Z',
  },
  pointsById: { a: { id: 'a', reference: 'Bodega', timeWindow: null } },
  depotPointId: 'a',
};

describe('storage — sesión de ruta activa', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda y restaura la ruta activa', () => {
    saveActiveSession(session);
    expect(loadActiveSession()).toEqual(session);
  });

  it('una ruta COMPLETED no se restaura (se borra)', () => {
    saveActiveSession(session);
    saveActiveSession({ ...session, route: { ...session.route, status: 'COMPLETED' } });
    expect(loadActiveSession()).toBeNull();
  });

  it('devuelve null si no hay nada guardado', () => {
    expect(loadActiveSession()).toBeNull();
  });

  it('devuelve null (sin lanzar) si el contenido no es JSON válido', () => {
    localStorage.setItem(KEY, '{no es json');
    expect(loadActiveSession()).toBeNull();
  });

  it('devuelve null si la estructura guardada está incompleta', () => {
    localStorage.setItem(KEY, JSON.stringify({ route: {} }));
    expect(loadActiveSession()).toBeNull();
  });

  it('clearActiveSession borra la sesión', () => {
    saveActiveSession(session);
    clearActiveSession();
    expect(loadActiveSession()).toBeNull();
  });
});
