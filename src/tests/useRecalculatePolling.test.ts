import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { RouteResponseDto } from '@/models';

vi.mock('@/services/routeService', () => ({
  routeService: { recalculate: vi.fn() },
}));

import { routeService } from '@/services/routeService';
import { useRecalculatePolling } from '@/hooks/useRecalculatePolling';
import { config } from '@/config';

const route: RouteResponseDto = {
  routeId: 'r1',
  status: 'ACTIVE',
  stops: [],
  totalDistanceMeters: 0,
  totalTimeSeconds: 0,
  updatedAt: '2026-01-01T00:00:00Z',
};

/**
 * Regresión: el hook solo hacía polling con 'IN_PROGRESS', un estado que el
 * backend real nunca envía (envía 'ACTIVE'), así que el recálculo por tráfico
 * jamás arrancaba. Estas pruebas fijan el estado real.
 */
describe('useRecalculatePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(routeService.recalculate).mockResolvedValue(route);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('hace polling mientras la ruta está ACTIVE', async () => {
    const onUpdate = vi.fn();
    renderHook(() => useRecalculatePolling('r1', 'ACTIVE', onUpdate));

    await vi.advanceTimersByTimeAsync(config.recalculateIntervalMs);

    expect(routeService.recalculate).toHaveBeenCalledWith('r1');
    expect(onUpdate).toHaveBeenCalledWith(route);
  });

  it('no hace polling cuando la ruta está COMPLETED', async () => {
    renderHook(() => useRecalculatePolling('r1', 'COMPLETED', vi.fn()));

    await vi.advanceTimersByTimeAsync(config.recalculateIntervalMs * 2);

    expect(routeService.recalculate).not.toHaveBeenCalled();
  });

  it('no hace polling sin routeId', async () => {
    renderHook(() => useRecalculatePolling(null, 'ACTIVE', vi.fn()));

    await vi.advanceTimersByTimeAsync(config.recalculateIntervalMs * 2);

    expect(routeService.recalculate).not.toHaveBeenCalled();
  });
});
