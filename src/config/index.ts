/**
 * Configuración de variables de entorno.
 * Un solo lugar donde se leen todas las variables de VITE.
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  recalculateIntervalMs: Number(import.meta.env.VITE_RECALCULATE_INTERVAL_MS ?? '30000'),
} as const;
