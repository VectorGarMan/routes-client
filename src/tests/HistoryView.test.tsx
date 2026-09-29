import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { RouteResponseDto } from '@/models';

vi.mock('@/services/routeService', () => ({
  routeService: { getHistory: vi.fn() },
}));

import { routeService } from '@/services/routeService';
import { HistoryView } from '@/views/HistoryView';

function makeRoute(id: string, status: RouteResponseDto['status']): RouteResponseDto {
  return {
    routeId: id,
    status,
    stops: [
      { pointId: 'a', order: 0, status: 'VISITED' },
      { pointId: 'b', order: 1, status: 'PENDING' },
    ],
    totalDistanceMeters: 1200,
    totalTimeSeconds: 600,
    updatedAt: '2026-01-01T10:00:00-06:00',
  };
}

/**
 * Regresión: HistoryView esperaba un objeto de página ({ content, totalPages })
 * y el backend real devuelve un arreglo plano, lo que rompía la vista.
 */
describe('HistoryView', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra las rutas cuando el backend devuelve un arreglo plano', async () => {
    vi.mocked(routeService.getHistory).mockResolvedValue([
      makeRoute('r1', 'ACTIVE'),
      makeRoute('r2', 'COMPLETED'),
    ]);

    render(<HistoryView />);

    expect(await screen.findByText('En curso')).toBeInTheDocument();
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });

  it('muestra el estado vacío con un arreglo vacío', async () => {
    vi.mocked(routeService.getHistory).mockResolvedValue([]);

    render(<HistoryView />);

    expect(await screen.findByText('No hay rutas en el historial.')).toBeInTheDocument();
  });

  it('oculta la paginación si la página no está llena (no hay siguiente)', async () => {
    vi.mocked(routeService.getHistory).mockResolvedValue([makeRoute('r1', 'ACTIVE')]);

    render(<HistoryView />);

    await screen.findByText('En curso');
    expect(screen.queryByText(/Siguiente/)).toBeNull();
  });

  it('habilita "Siguiente" cuando la página llega llena (20 rutas)', async () => {
    const fullPage = Array.from({ length: 20 }, (_, i) => makeRoute(`r${i}`, 'ACTIVE'));
    vi.mocked(routeService.getHistory).mockResolvedValue(fullPage);

    render(<HistoryView />);

    expect(await screen.findByRole('button', { name: /Siguiente/ })).toBeEnabled();
  });
});
