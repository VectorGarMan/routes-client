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
 * Valida que al menos address o (latitude y longitude) estén presentes.
 */
export function validateLocation(
  address: string,
  latitude: string,
  longitude: string
): string | null {
  const hasAddress = address.trim().length > 0;
  const hasLat = latitude.trim().length > 0;
  const hasLng = longitude.trim().length > 0;

  if (!hasAddress && !(hasLat && hasLng)) {
    return 'Debes proporcionar una dirección o coordenadas (latitud y longitud).';
  }
  if ((hasLat && !hasLng) || (!hasLat && hasLng)) {
    return 'Si ingresas coordenadas, debes proporcionar latitud Y longitud.';
  }
  if (hasLat) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) return 'La latitud debe estar entre -90 y 90.';
    if (isNaN(lng) || lng < -180 || lng > 180)
      return 'La longitud debe estar entre -180 y 180.';
  }
  return null;
}
