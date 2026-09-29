import { describe, it, expect } from 'vitest';
import { validateReference, validateAddress, getNextStop } from '@/utils/routeUtils';
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

// ─── validateAddress ──────────────────────────────────────────────────────────

describe('validateAddress', () => {
  it('acepta una dirección válida', () => {
    expect(validateAddress('Av. Insurgentes Sur 123, CDMX')).toBeNull();
  });

  it('rechaza dirección vacía', () => {
    expect(validateAddress('')).not.toBeNull();
  });

  it('rechaza dirección con solo espacios', () => {
    expect(validateAddress('   ')).not.toBeNull();
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
