import React, { useState } from 'react';
import { CaptureView } from '@/views/CaptureView';
import { ActiveRouteView } from '@/views/ActiveRouteView';
import { HistoryView } from '@/views/HistoryView';
import { loadActiveSession, saveActiveSession } from '@/utils/storage';
import type { RouteResponseDto, DeliveryPointResponse } from '@/models';
import 'leaflet/dist/leaflet.css';
import './App.css';

type AppView = 'capture' | 'active' | 'history';

export default function App() {
  // Si se recargó la página con una ruta en curso, se restaura y se vuelve a ella.
  const [initialSession] = useState(loadActiveSession);
  const [view, setView] = useState<AppView>(initialSession ? 'active' : 'capture');
  const [activeRoute, setActiveRoute] = useState<RouteResponseDto | null>(
    initialSession?.route ?? null
  );
  const [pointsById, setPointsById] = useState<Record<string, DeliveryPointResponse>>(
    initialSession?.pointsById ?? {}
  );
  const [depotPointId, setDepotPointId] = useState<string>(initialSession?.depotPointId ?? '');

  function handleRouteCalculated(
    route: RouteResponseDto,
    pts: Record<string, DeliveryPointResponse>
  ) {
    // Depot = primera parada (order=0)
    const depot = route.stops.find((s) => s.order === 0);
    const depotId = depot?.pointId ?? '';
    setActiveRoute(route);
    setPointsById(pts);
    setDepotPointId(depotId);
    setView('active');
    saveActiveSession({ route, pointsById: pts, depotPointId: depotId });
  }

  function handleRouteUpdated(route: RouteResponseDto) {
    setActiveRoute(route);
    saveActiveSession({ route, pointsById, depotPointId });
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
