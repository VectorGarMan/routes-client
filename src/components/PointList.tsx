import React from 'react';
import type { DeliveryPointResponse } from '@/models';
import { formatTime } from '@/utils/format';

interface Props {
  points: DeliveryPointResponse[];
  depotPointId: string | null;
  invalidPointIds: Set<string>;
  onSetDepot: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * FE-005: Lista de puntos capturados con orden estable.
 * Muestra reference/address; IDs solo si ?debug=1 en URL.
 */
export function PointList({
  points,
  depotPointId,
  invalidPointIds,
  onSetDepot,
  onDelete,
}: Props) {
  const isDebug = new URLSearchParams(window.location.search).has('debug');

  if (points.length === 0) {
    return (
      <p className="empty-state">
        No hay puntos registrados. Agrega el primero usando el formulario.
      </p>
    );
  }

  return (
    <ul className="point-list">
      {points.map((point, idx) => {
        const isDepot = point.id === depotPointId;
        const isInvalid = invalidPointIds.has(point.id);

        return (
          <li
            key={point.id}
            className={`point-item${isDepot ? ' point-depot' : ''}${isInvalid ? ' point-invalid' : ''}`}
          >
            <div className="point-index">{idx + 1}</div>
            <div className="point-info">
              <strong>{point.reference}</strong>
              {point.address && <span className="point-address">{point.address}</span>}
              {point.latitude != null && point.longitude != null && (
                <span className="point-coords">
                  {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                </span>
              )}
              {point.timeWindow && (
                <span className="point-window">
                  ⏰ {formatTime(point.timeWindow.start)} – {formatTime(point.timeWindow.end)}
                </span>
              )}
              {isDebug && (
                <span className="point-id debug-only">ID: {point.id}</span>
              )}
              {isInvalid && (
                <span className="point-invalid-badge">⚠️ Ubicación inválida</span>
              )}
            </div>
            <div className="point-actions">
              {!isDepot && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => onSetDepot(point.id)}
                  title="Marcar como depósito"
                >
                  Depósito
                </button>
              )}
              {isDepot && <span className="badge badge-depot">Depósito</span>}
              <button
                className="btn btn-sm btn-danger"
                onClick={() => onDelete(point.id)}
                title="Eliminar punto"
              >
                ✕
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
