/**
 * Utilidades de formato para presentación.
 * Las conversiones de unidades SOLO ocurren aquí.
 * El resto de la app trabaja internamente con metros y segundos.
 */

import type { RouteStatus } from '@/models';

/**
 * Convierte metros a kilómetros con 1 decimal.
 * Ej: 1530 → "1.5 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Convierte segundos a texto legible.
 * Ej: 3720 → "1 h 2 min"
 */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

const ROUTE_STATUS_LABELS: Record<RouteStatus, string> = {
  CALCULATING: 'Calculando',
  ACTIVE: 'En curso',
  COMPLETED: 'Completada',
  ERROR: 'Con error',
};

/**
 * Etiqueta en español del estado de una ruta. Si el backend agrega un estado
 * nuevo, se muestra tal cual en lugar de dejar el badge vacío.
 */
export function routeStatusLabel(status: string): string {
  return ROUTE_STATUS_LABELS[status as RouteStatus] ?? status;
}

/**
 * Formatea una cadena ISO-8601 a fecha/hora local legible.
 * Ej: "2024-01-15T09:00:00-06:00" → "15/01/2024, 09:00"
 */
export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Formatea solo la hora de una cadena ISO-8601.
 * Ej: "2024-01-15T09:00:00-06:00" → "09:00"
 */
export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Convierte un Date local a string ISO-8601 con offset local.
 * Necesario para enviar TimeWindowDto al backend.
 */
export function toIsoWithOffset(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${offsetHours}:${offsetMins}`
  );
}
