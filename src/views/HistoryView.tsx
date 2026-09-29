import React, { useState, useEffect, useCallback } from 'react';
import { routeService } from '@/services/routeService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { formatDistance, formatDuration, formatDateTime } from '@/utils/format';
import type { RouteResponseDto, PageResponse } from '@/models';

const PAGE_SIZE = 20;

/**
 * FE-016: Vista de historial de rutas paginado. Solo lectura.
 */
export function HistoryView() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<PageResponse<RouteResponseDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeService.getHistory(p, PAGE_SIZE);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [fetchHistory, page]);

  return (
    <div className="history-view">
      <h2>Historial de rutas</h2>

      {loading && <LoadingSpinner message="Cargando historial…" />}
      {error && <ErrorMessage message={error} onRetry={() => fetchHistory(page)} />}

      {!loading && !error && result && (
        <>
          {result.content.length === 0 ? (
            <p className="empty-state">No hay rutas en el historial.</p>
          ) : (
            <ul className="history-list">
              {result.content.map((route) => (
                <li key={route.routeId} className="history-item">
                  <div className="history-header">
                    <span className={`badge badge-status badge-${route.status.toLowerCase()}`}>
                      {route.status === 'COMPLETED' && 'Completada'}
                      {route.status === 'IN_PROGRESS' && 'En curso'}
                      {route.status === 'PENDING' && 'Pendiente'}
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
          {result.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </button>
              <span>
                Página {page + 1} de {result.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= result.totalPages - 1}
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
