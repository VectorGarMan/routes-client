/**
 * Configuración de variables de entorno.
 * Un solo lugar donde se leen todas las variables de VITE.
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  recalculateIntervalMs: Number(import.meta.env.VITE_RECALCULATE_INTERVAL_MS ?? '30000'),
  // Token PÚBLICO de Mapbox (pk.*) solo para dibujar teselas en el navegador.
  // Nunca poner aquí un token secreto (sk.*): todo lo de VITE_* queda visible.
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
  mapboxStyle: import.meta.env.VITE_MAPBOX_STYLE ?? 'mapbox/streets-v12',
} as const;
