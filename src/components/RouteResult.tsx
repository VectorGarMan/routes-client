import React from 'react';
import type { RouteResponseDto, DeliveryPointResponse } from '@/models';
import { formatDistance, formatDuration } from '@/utils/format';
import { getNextStop } from '@/utils/routeUtils';

interface Props {
  route: RouteResponseDto;
  pointsById: Record<string, DeliveryPointResponse>;
}

/**
 * FE-009: Resumen del resultado de la ruta calculada.
 * Muestra el orden de paradas, distancia y tiempo (convertidos solo aquí).
 */
export function RouteResult({ route, pointsById }: Props) {
  const nextStop = getNextStop(route.stops);

  return (
    <div className="route-result">
      <div className="route-summary">
        <div className="route-stat">
          <span className="stat-label">Distancia total</span>
          <span className="stat-value">{formatDistance(route.totalDistanceMeters)}</span>
        </div>
        <div className="route-stat">
          <span className="stat-label">Tiempo estimado</span>
          <span className="stat-value">{formatDuration(route.totalTimeSeconds)}</span>
        </div>
        <div className="route-stat">
          <span className="stat-label">Estado</span>
          <span className={`badge badge-status badge-${route.status.toLowerCase()}`}>
            {route.status === 'PENDING' && 'Pendiente'}
            {route.status === 'IN_PROGRESS' && 'En curso'}
            {route.status === 'COMPLETED' && 'Completada'}
          </span>
        </div>
      </div>

      <ol className="stop-list">
        {[...route.stops]
          .sort((a, b) => a.order - b.order)
          .map((stop) => {
            const point = pointsById[stop.pointId];
            const isNext = stop.pointId === nextStop?.pointId;
            const isVisited = stop.status === 'VISITED';
            const isDepot = stop.order === 0;

            return (
              <li
                key={stop.pointId}
                className={`stop-item${isNext ? ' stop-next' : ''}${isVisited ? ' stop-visited' : ''}${isDepot ? ' stop-depot' : ''}`}
              >
                <span className="stop-order">{stop.order === 0 ? '🏠' : stop.order}</span>
                <span className="stop-ref">
                  {point?.reference ?? stop.pointId}
                  {point?.address && (
                    <span className="stop-address"> — {point.address}</span>
                  )}
                </span>
                <span className={`stop-status stop-status-${stop.status.toLowerCase()}`}>
                  {isDepot && stop.status === 'VISITED' && '✓ Salida'}
                  {isDepot && stop.status === 'PENDING' && 'Salida'}
                  {!isDepot && stop.status === 'VISITED' && '✓ Visitado'}
                  {!isDepot && stop.status === 'PENDING' && isNext && '→ Siguiente'}
                  {!isDepot && stop.status === 'PENDING' && !isNext && 'Pendiente'}
                </span>
              </li>
            );
          })}
      </ol>
    </div>
  );
}
