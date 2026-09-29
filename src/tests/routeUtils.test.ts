import { describe, it, expect } from 'vitest';
import { validateReference, validateLocation, getNextStop } from '@/utils/routeUtils';
import type { RouteStopDto } from '@/models';

// ─── validateReference ────────────────────────────────────────────────────────

describe('validateReference', () => {
  it('devuelve null cuando la referencia es válida', () => {
    expect(validateReference('Casa del cliente')).toBeNull();
  });

  it('devuelve error cuando la referencia está vacía', () => {
    expect(validateReference('')).not.toBeNull();
  });

  it('devuelve error cuando solo tiene espacios', () => {
    expect(validateReference('   ')).not.toBeNull();
  });
});

// ─── validateLocation ─────────────────────────────────────────────────────────

describe('validateLocation', () => {
  it('acepta solo address', () => {
    expect(validateLocation('Av. Insurgentes 123', '', '')).toBeNull();
  });

  it('acepta latitud + longitud válidas', () => {
    expect(validateLocation('', '19.4326', '-99.1332')).toBeNull();
  });

  it('rechaza si ni address ni coordenadas', () => {
    expect(validateLocation('', '', '')).not.toBeNull();
  });

  it('rechaza latitud sin longitud', () => {
    expect(validateLocation('', '19.4326', '')).not.toBeNull();
  });

  it('rechaza longitud sin latitud', () => {
    expect(validateLocation('', '', '-99.1332')).not.toBeNull();
  });

  it('rechaza latitud fuera de rango', () => {
    expect(validateLocation('', '200', '-99.1332')).not.toBeNull();
  });

  it('rechaza longitud fuera de rango', () => {
    expect(validateLocation('', '19.4326', '-200')).not.toBeNull();
  });
});

// ─── getNextStop ──────────────────────────────────────────────────────────────

describe('getNextStop', () => {
  const stops: RouteStopDto[] = [
    { pointId: 'a', order: 0, status: 'VISITED' },
    { pointId: 'b', order: 1, status: 'VISITED' },
    { pointId: 'c', order: 2, status: 'PENDING' },
    { pointId: 'd', order: 3, status: 'PENDING' },
  ];

  it('devuelve la primera parada PENDING según order', () => {
    expect(getNextStop(stops)?.pointId).toBe('c');
  });

  it('devuelve undefined si todas están visitadas', () => {
    const all = stops.map((s) => ({ ...s, status: 'VISITED' as const }));
    expect(getNextStop(all)).toBeUndefined();
  });

  it('maneja array desordenado correctamente', () => {
    const unordered: RouteStopDto[] = [
      { pointId: 'z', order: 3, status: 'PENDING' },
      { pointId: 'a', order: 0, status: 'VISITED' },
      { pointId: 'b', order: 1, status: 'PENDING' },
    ];
    expect(getNextStop(unordered)?.pointId).toBe('b');
  });
});
