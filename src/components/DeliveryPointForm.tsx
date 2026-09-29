import React, { useState } from 'react';
import type { DeliveryPointRequest, TimeWindowDto } from '@/models';
import { validateReference, validateAddress } from '@/utils/routeUtils';
import { toIsoWithOffset } from '@/utils/format';

interface Props {
  onSubmit: (payload: DeliveryPointRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * FE-004: Formulario de captura de un punto de entrega.
 * Solo requiere dirección; el backend (Mapbox) resuelve las coordenadas.
 */
export function DeliveryPointForm({ onSubmit, loading, error }: Props) {
  const [reference, setReference] = useState('');
  const [address, setAddress] = useState('');
  const [useTimeWindow, setUseTimeWindow] = useState(false);
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const refError = validateReference(reference);
    if (refError) { setFormError(refError); return; }

    const addrError = validateAddress(address);
    if (addrError) { setFormError(addrError); return; }

    if (useTimeWindow && (!windowStart || !windowEnd)) {
      setFormError('Completa la hora de inicio y fin de la ventana de tiempo.');
      return;
    }

    let timeWindow: TimeWindowDto | undefined;
    if (useTimeWindow && windowStart && windowEnd) {
      timeWindow = {
        start: toIsoWithOffset(new Date(windowStart)),
        end: toIsoWithOffset(new Date(windowEnd)),
      };
    }

    const payload: DeliveryPointRequest = {
      reference: reference.trim(),
      address: address.trim(),
    };

    if (timeWindow) payload.timeWindow = timeWindow;

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="capture-form" noValidate>
      <div className="form-group">
        <label htmlFor="reference">Referencia *</label>
        <input
          id="reference"
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ej: Casa del cliente, Tienda Norte"
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">Dirección *</label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej: Av. Insurgentes Sur 123, CDMX"
          disabled={loading}
          required
        />
      </div>

      <div className="form-group form-check">
        <input
          id="useTimeWindow"
          type="checkbox"
          checked={useTimeWindow}
          onChange={(e) => setUseTimeWindow(e.target.checked)}
          disabled={loading}
        />
        <label htmlFor="useTimeWindow">Agregar ventana de tiempo</label>
      </div>

      {useTimeWindow && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="windowStart">Desde</label>
            <input
              id="windowStart"
              type="datetime-local"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="windowEnd">Hasta</label>
            <input
              id="windowEnd"
              type="datetime-local"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {(formError || error) && (
        <div className="error-message" role="alert">
          ⚠️ {formError || error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Registrando…' : 'Agregar punto'}
      </button>
    </form>
  );
}
