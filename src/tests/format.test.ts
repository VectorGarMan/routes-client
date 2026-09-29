import { describe, it, expect } from 'vitest';
import { routeStatusLabel } from '@/utils/format';

describe('routeStatusLabel', () => {
  it.each([
    ['CALCULATING', 'Calculando'],
    ['ACTIVE', 'En curso'],
    ['COMPLETED', 'Completada'],
    ['ERROR', 'Con error'],
  ])('traduce el estado real del backend %s', (status, label) => {
    expect(routeStatusLabel(status)).toBe(label);
  });

  it('muestra un estado desconocido tal cual en vez de dejar el badge vacío', () => {
    expect(routeStatusLabel('NUEVO_ESTADO')).toBe('NUEVO_ESTADO');
  });
});
