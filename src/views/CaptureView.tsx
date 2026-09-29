import React, { useState, useCallback } from 'react';
import { DeliveryPointForm } from '@/components/DeliveryPointForm';
import { PointList } from '@/components/PointList';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { deliveryPointService } from '@/services/deliveryPointService';
import { routeService } from '@/services/routeService';
import type { DeliveryPointRequest, DeliveryPointResponse, RouteObjective, OptimizeRouteRequest, RouteResponseDto } from '@/models';
import { ApiDomainError } from '@/services/httpClient';

interface Props {
  onRouteCalculated: (
    route: RouteResponseDto,
    pointsById: Record<string, DeliveryPointResponse>
  ) => void;
}

/**
 * FE-004/005/006/007: Vista de captura de puntos y cálculo de ruta.
 */
export function CaptureView({ onRouteCalculated }: Props) {
  const [points, setPoints] = useState<DeliveryPointResponse[]>([]);
  const [depotPointId, setDepotPointId] = useState<string | null>(null);
  const [invalidPointIds, setInvalidPointIds] = useState<Set<string>>(new Set());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [objective, setObjective] = useState<RouteObjective>('DISTANCE');

  const handleAddPoint = useCallback(async (payload: DeliveryPointRequest) => {
    setAddLoading(true);
    setAddError(null);
    try {
      const created = await deliveryPointService.create(payload);
      setPoints((prev) => {
        const next = [...prev, created];
        // Si es el primer punto, lo marcamos como depósito por defecto
        if (next.length === 1) setDepotPointId(created.id);
        return next;
      });
    } catch (err) {
      if (err instanceof ApiDomainError) {
        if (err.code === 'LOCATION_INVALID') {
          // FE-006: marcar el último punto como inválido si existiera
          setInvalidPointIds((prev) => new Set(prev));
        }
        setAddError(err.message);
      } else {
        setAddError('Error al registrar el punto.');
      }
    } finally {
      setAddLoading(false);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
    setInvalidPointIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDepotPointId((prev) => (prev === id ? null : prev));
  }, []);

  const handleSetDepot = useCallback((id: string) => {
    setDepotPointId(id);
  }, []);

  const hasInvalid = invalidPointIds.size > 0;
  const canCalculate = points.length >= 2 && depotPointId !== null && !hasInvalid;

  const handleCalculate = useCallback(async () => {
    if (!canCalculate || !depotPointId) return;
    setCalcLoading(true);
    setCalcError(null);

    const payload: OptimizeRouteRequest = {
      pointIds: points.map((p) => p.id), // orden de captura, no reordenar
      objective,
      depotPointId,
    };

    try {
      const route = await routeService.optimize(payload);
      const pointsById: Record<string, DeliveryPointResponse> = {};
      points.forEach((p) => { pointsById[p.id] = p; });
      onRouteCalculated(route, pointsById);
    } catch (err) {
      if (err instanceof ApiDomainError) {
        setCalcError(err.message);
      } else {
        setCalcError('Error al calcular la ruta. Intenta de nuevo.');
      }
    } finally {
      setCalcLoading(false);
    }
  }, [canCalculate, depotPointId, points, objective, onRouteCalculated]);

  return (
    <div className="capture-view">
      <h2>Registrar puntos de entrega</h2>

      <DeliveryPointForm
        onSubmit={handleAddPoint}
        loading={addLoading}
        error={addError}
      />

      {points.length > 0 && (
        <section className="points-section">
          <h3>Puntos registrados ({points.length})</h3>
          <PointList
            points={points}
            depotPointId={depotPointId}
            invalidPointIds={invalidPointIds}
            onSetDepot={handleSetDepot}
            onDelete={handleDelete}
          />
        </section>
      )}

      {points.length >= 2 && (
        <section className="calculate-section">
          <div className="form-group">
            <label htmlFor="objective">Optimizar por</label>
            <select
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value as RouteObjective)}
              disabled={calcLoading}
            >
              <option value="DISTANCE">Distancia mínima</option>
              <option value="TIME">Tiempo mínimo</option>
            </select>
          </div>

          {!depotPointId && (
            <p className="warning-text">⚠️ Selecciona un punto como depósito.</p>
          )}
          {hasInvalid && (
            <p className="warning-text">
              ⚠️ Hay puntos con ubicación inválida. Corrígelos antes de calcular.
            </p>
          )}

          {calcError && (
            <div className="error-message" role="alert">
              ⚠️ {calcError}
            </div>
          )}

          {calcLoading ? (
            <LoadingSpinner message="Calculando ruta óptima…" />
          ) : (
            <button
              className="btn btn-primary btn-large"
              onClick={handleCalculate}
              disabled={!canCalculate}
            >
              Calcular ruta óptima
            </button>
          )}
        </section>
      )}
    </div>
  );
}
