import { useEffect, useRef } from 'react';
import { routeService } from '@/services/routeService';
import { config } from '@/config';
import type { RouteResponseDto } from '@/models';

/**
 * Polling periódico al endpoint de recálculo mientras la ruta está IN_PROGRESS.
 * Se detiene automáticamente cuando status === COMPLETED o el componente desmonta.
 *
 * @param routeId  - ID de la ruta activa (null = sin ruta activa)
 * @param status   - Estado actual de la ruta
 * @param onUpdate - Callback con la nueva RouteResponseDto si hubo cambios
 */
export function useRecalculatePolling(
  routeId: string | null,
  status: string | null,
  onUpdate: (route: RouteResponseDto) => void,
  onNotify?: () => void
) {
  const onUpdateRef = useRef(onUpdate);
  const onNotifyRef = useRef(onNotify);
  onUpdateRef.current = onUpdate;
  onNotifyRef.current = onNotify;

  useEffect(() => {
    if (!routeId || status !== 'IN_PROGRESS') return;

    const interval = setInterval(async () => {
      try {
        const updated = await routeService.recalculate(routeId);
        onUpdateRef.current(updated);
        onNotifyRef.current?.();
      } catch {
        // Errores de polling no deben interrumpir la app
      }
    }, config.recalculateIntervalMs);

    return () => clearInterval(interval);
  }, [routeId, status]);
}
