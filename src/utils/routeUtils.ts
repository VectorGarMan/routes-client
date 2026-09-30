import type { RouteStopDto } from '@/models';

/**
 * Devuelve la primera parada con status PENDING ordenada por `order`.
 * El depósito (order=0) también puede ser la siguiente si aún está PENDING.
 * Retorna undefined si todas están VISITADAS.
 */
export function getNextStop(stops: RouteStopDto[]): RouteStopDto | undefined {
  return [...stops]
    .sort((a, b) => a.order - b.order)
    .find((s) => s.status === 'PENDING');
}

/**
 * Valida que una referencia no esté vacía.
 */
export function validateReference(ref: string): string | null {
  if (!ref.trim()) return 'La referencia es obligatoria.';
  return null;
}

/**
 * Valida que la dirección no esté vacía.
 * Las coordenadas las resuelve el backend (Mapbox) a partir de la dirección.
 */
export function validateAddress(address: string): string | null {
  if (!address.trim()) return 'La dirección es obligatoria.';
  return null;
}
