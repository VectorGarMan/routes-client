import React, { useState } from 'react';
import { CaptureView } from '@/views/CaptureView';
import { ActiveRouteView } from '@/views/ActiveRouteView';
import { HistoryView } from '@/views/HistoryView';
import type { RouteResponseDto, DeliveryPointResponse } from '@/models';
import 'leaflet/dist/leaflet.css';
import './App.css';

type AppView = 'capture' | 'active' | 'history';

export default function App() {
  const [view, setView] = useState<AppView>('capture');
  const [activeRoute, setActiveRoute] = useState<RouteResponseDto | null>(null);
  const [pointsById, setPointsById] = useState<Record<string, DeliveryPointResponse>>({});
  const [depotPointId, setDepotPointId] = useState<string>('');

  function handleRouteCalculated(
    route: RouteResponseDto,
    pts: Record<string, DeliveryPointResponse>
  ) {
    setActiveRoute(route);
    setPointsById(pts);
    // Depot = primera parada (order=0)
    const depot = route.stops.find((s) => s.order === 0);
    setDepotPointId(depot?.pointId ?? '');
    setView('active');
  }

  function handleRouteUpdated(route: RouteResponseDto) {
    setActiveRoute(route);
  }

  return (
    <div className="app">
      {/* Barra de navegación */}
      <nav className="nav-bar">
        <span className="nav-brand">🚚 Routes App</span>
        <div className="nav-links">
          <button
            className={`nav-link${view === 'capture' ? ' active' : ''}`}
            onClick={() => setView('capture')}
          >
            Captura
          </button>
          {activeRoute && (
            <button
              className={`nav-link${view === 'active' ? ' active' : ''}`}
              onClick={() => setView('active')}
            >
              Ruta activa
            </button>
          )}
          <button
            className={`nav-link${view === 'history' ? ' active' : ''}`}
            onClick={() => setView('history')}
          >
            Historial
          </button>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="main-content">
        {view === 'capture' && (
          <CaptureView onRouteCalculated={handleRouteCalculated} />
        )}
        {view === 'active' && activeRoute && (
          <ActiveRouteView
            route={activeRoute}
            pointsById={pointsById}
            depotPointId={depotPointId}
            onRouteUpdated={handleRouteUpdated}
            onBack={() => setView('capture')}
          />
        )}
        {view === 'history' && <HistoryView />}
      </main>
    </div>
  );
}
