import { useState, useEffect, useCallback } from 'react';
import { routeService } from '@/services/routeService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { formatDistance, formatDuration, formatDateTime, routeStatusLabel } from '@/utils/format';
import type { RouteResponseDto } from '@/models';

const PAGE_SIZE = 20;

/**
 * FE-016: Vista de historial de rutas paginado. Solo lectura.
 *
 * El backend devuelve un arreglo plano (sin totalPages): si la página llega
 * llena puede haber una siguiente; si llega con menos de PAGE_SIZE es la última.
 */
export function HistoryView() {
  const [page, setPage] = useState(0);
  const [routes, setRoutes] = useState<RouteResponseDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeService.getHistory(p, PAGE_SIZE);
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [fetchHistory, page]);

  const hasNext = routes !== null && routes.length === PAGE_SIZE;
  const showPagination = page > 0 || hasNext;

  return (
    <div className="history-view">
      <h2>Historial de rutas</h2>

      {loading && <LoadingSpinner message="Cargando historial…" />}
      {error && <ErrorMessage message={error} onRetry={() => fetchHistory(page)} />}

      {!loading && !error && routes && (
        <>
          {routes.length === 0 ? (
            <p className="empty-state">
              {page === 0 ? 'No hay rutas en el historial.' : 'No hay más rutas.'}
            </p>
          ) : (
            <ul className="history-list">
              {routes.map((route) => (
                <li key={route.routeId} className="history-item">
                  <div className="history-header">
                    <span className={`badge badge-status badge-${route.status.toLowerCase()}`}>
                      {routeStatusLabel(route.status)}
                    </span>
                    <span className="history-date">{formatDateTime(route.updatedAt)}</span>
                  </div>
                  <div className="history-stats">
                    <span>📏 {formatDistance(route.totalDistanceMeters)}</span>
                    <span>⏱ {formatDuration(route.totalTimeSeconds)}</span>
                    <span>🛑 {route.stops.length} paradas</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Paginación */}
          {showPagination && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </button>
              <span>Página {page + 1}</span>
              <button
                className="btn btn-secondary"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
