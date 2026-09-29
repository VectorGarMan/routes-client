import React, { useState } from 'react';
import type { DeliveryPointRequest, TimeWindowDto } from '@/models';
import { validateReference, validateLocation } from '@/utils/routeUtils';
import { toIsoWithOffset } from '@/utils/format';

interface Props {
  onSubmit: (payload: DeliveryPointRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * FE-004: Formulario de captura de un punto de entrega.
 * Produce exactamente el payload DeliveryPointRequest.
 */
export function DeliveryPointForm({ onSubmit, loading, error }: Props) {
  const [reference, setReference] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [useTimeWindow, setUseTimeWindow] = useState(false);
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const refError = validateReference(reference);
    if (refError) { setFormError(refError); return; }

    const locError = validateLocation(address, latitude, longitude);
    if (locError) { setFormError(locError); return; }

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
    };

    if (address.trim()) payload.address = address.trim();

    if (latitude.trim() && longitude.trim()) {
      payload.latitude = parseFloat(latitude);
      payload.longitude = parseFloat(longitude);
    }

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
        <label htmlFor="address">Dirección</label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej: Av. Insurgentes Sur 123, CDMX"
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="latitude">Latitud</label>
          <input
            id="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="-90 a 90"
            disabled={loading}
            min="-90"
            max="90"
          />
        </div>
        <div className="form-group">
          <label htmlFor="longitude">Longitud</label>
          <input
            id="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="-180 a 180"
            disabled={loading}
            min="-180"
            max="180"
          />
        </div>
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
