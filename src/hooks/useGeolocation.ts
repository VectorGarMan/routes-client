import { useState, useEffect } from 'react';

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number }
  | { status: 'error'; reason: string };

/**
 * Provee la ubicación actual del dispositivo.
 * Maneja el caso de permiso denegado o no disponible sin romper la app.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', reason: 'Geolocalización no disponible en este dispositivo.' });
      return;
    }

    setState({ status: 'loading' });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          status: 'success',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        let reason = 'No se pudo obtener la ubicación.';
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          reason = 'Permiso de ubicación denegado.';
        } else if (err.code === GeolocationPositionError.TIMEOUT) {
          reason = 'Tiempo de espera de ubicación agotado.';
        }
        setState({ status: 'error', reason });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
