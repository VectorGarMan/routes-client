import React, { useState, useCallback } from 'react';
import { MapView } from '@/components/MapView';
import { RouteResult } from '@/components/RouteResult';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';
import { routeService } from '@/services/routeService';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRecalculatePolling } from '@/hooks/useRecalculatePolling';
import { getNextStop } from '@/utils/routeUtils';
import { ApiDomainError } from '@/services/httpClient';
import type { RouteResponseDto, DeliveryPointResponse } from '@/models';

interface Props {
  route: RouteResponseDto;
  pointsById: Record<string, DeliveryPointResponse>;
  depotPointId: string;
  onRouteUpdated: (route: RouteResponseDto) => void;
  onBack: () => void;
}

/**
 * FE-009/010/011/012/013: Vista de ruta activa.
 * Muestra mapa, paradas, siguiente destino y botón "Marcar visitada".
 * Polling de recálculo mientras la ruta está IN_PROGRESS.
 */
export function ActiveRouteView({ route: initialRoute, pointsById, depotPointId, onRouteUpdated, onBack }: Props) {
  const [route, setRoute] = useState<RouteResponseDto>(initialRoute);
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [routeUpdatedNotice, setRouteUpdatedNotice] = useState(false);

  const geo = useGeolocation();
  const currentPosition =
    geo.status === 'success' ? { lat: geo.lat, lng: geo.lng } : undefined;

  const nextStop = getNextStop(route.stops);

  // FE-013: Polling periódico de recálculo
  useRecalculatePolling(
    route.status === 'COMPLETED' ? null : route.routeId,
    route.status,
    (updated) => {
      setRoute(updated);
      onRouteUpdated(updated);
    },
    () => {
      setRouteUpdatedNotice(true);
      setTimeout(() => setRouteUpdatedNotice(false), 4000);
    }
  );

  // FE-012: Marcar parada visitada
  const handleMarkVisited = useCallback(async () => {
    if (!nextStop) return;
    setVisitLoading(true);
    setVisitError(null);
    try {
      const updated = await routeService.markVisited(route.routeId, nextStop.pointId);
      setRoute(updated);
      onRouteUpdated(updated);
    } catch (err) {
      if (err instanceof ApiDomainError) {
        setVisitError(err.message);
      } else {
        setVisitError('Error al marcar la parada. Intenta de nuevo.');
      }
    } finally {
      setVisitLoading(false);
    }
  }, [nextStop, route.routeId, onRouteUpdated]);

  const nextPoint = nextStop ? pointsById[nextStop.pointId] : undefined;
  const isCompleted = route.status === 'COMPLETED';

  return (
    <div className="active-route-view">
      {/* Aviso no intrusivo de ruta actualizada */}
      {routeUpdatedNotice && <Toast message="🔄 Ruta actualizada por tráfico." type="info" />}

      {/* Aviso de ruta completada */}
      {isCompleted && (
        <div className="completed-banner" role="status">
          🎉 ¡Ruta completada! Todas las paradas han sido visitadas.
        </div>
      )}

      {/* Panel superior: siguiente destino (siempre visible, FE-014) */}
      {!isCompleted && (
        <div className="next-stop-panel">
          {nextPoint ? (
            <>
              <div className="next-stop-label">Siguiente parada</div>
              <div className="next-stop-ref">{nextPoint.reference}</div>
              {nextPoint.address && (
                <div className="next-stop-address">{nextPoint.address}</div>
              )}
              {nextPoint.latitude != null && nextPoint.longitude != null && (
                <div className="next-stop-coords">
                  {nextPoint.latitude.toFixed(5)}, {nextPoint.longitude.toFixed(5)}
                </div>
              )}
              {visitError && (
                <ErrorMessage message={visitError} onRetry={handleMarkVisited} />
              )}
              {visitLoading ? (
                <LoadingSpinner message="Marcando parada…" />
              ) : (
                <button
                  className="btn btn-success btn-large"
                  onClick={handleMarkVisited}
                  disabled={visitLoading}
                >
                  ✓ Marcar como visitada
                </button>
              )}
            </>
          ) : (
            <p>Cargando siguiente parada…</p>
          )}
        </div>
      )}

      {/* Mapa (FE-010/011) */}
      <MapView
        pointsById={pointsById}
        stops={route.stops}
        nextPointId={nextStop?.pointId}
        depotPointId={depotPointId}
        currentPosition={currentPosition}
      />

      {/* Información de ubicación actual */}
      {geo.status === 'error' && (
        <p className="geo-warning">📍 {geo.reason}</p>
      )}

      {/* Lista de paradas con resultado (FE-009) */}
      <RouteResult route={route} pointsById={pointsById} />

      <button className="btn btn-secondary" onClick={onBack}>
        ← Volver a captura
      </button>
    </div>
  );
}
