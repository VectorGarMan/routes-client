import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DeliveryPointResponse, RouteStopDto } from '@/models';
import { config } from '@/config';

// Teselas raster de Mapbox (Static Tiles API). Con teselas de 512 px, Leaflet
// necesita tileSize=512 y zoomOffset=-1 (configuración recomendada por Mapbox).
const HAS_MAPBOX_TOKEN = config.mapboxToken.length > 0;
const MAPBOX_TILES_URL =
  `https://api.mapbox.com/styles/v1/${config.mapboxStyle}/tiles/{z}/{x}/{y}` +
  `?access_token=${encodeURIComponent(config.mapboxToken)}`;
const MAPBOX_ATTRIBUTION =
  '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ' +
  '&copy; <a href="https://www.openstreetmap.org/about/">OpenStreetMap</a>';

// Corregir ícono por defecto de Leaflet con Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import icon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl: icon2xUrl,
  shadowUrl: iconShadowUrl,
});

// ─── Íconos por estado ────────────────────────────────────────────────────────

const pendingIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl: icon2xUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const visitedIcon = new L.DivIcon({
  className: '',
  html: '<div style="background:#6b7280;width:20px;height:20px;border-radius:50%;border:2px solid white;"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const nextIcon = new L.DivIcon({
  className: '',
  html: '<div style="background:#22c55e;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const depotIcon = new L.DivIcon({
  className: '',
  html: '<div style="background:#3b82f6;width:28px;height:28px;border-radius:4px;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// ─── Sub-componente para recentrar el mapa ────────────────────────────────────

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);
  return null;
}

// ─── Props del MapView ────────────────────────────────────────────────────────

export interface MapViewProps {
  /** Puntos del registro local: id → DeliveryPointResponse */
  pointsById: Record<string, DeliveryPointResponse>;
  /** Paradas de la ruta activa (en orden del backend) */
  stops?: RouteStopDto[];
  /** pointId del siguiente destino */
  nextPointId?: string;
  /** pointId del depósito */
  depotPointId?: string;
  /** Ubicación actual del chofer */
  currentPosition?: { lat: number; lng: number };
}

/**
 * FE-010: Componente encapsulado de mapa.
 * Usa Leaflet con teselas de Mapbox (VITE_MAPBOX_TOKEN). Sin token cae a OpenStreetMap
 * y avisa. El proveedor puede cambiarse aquí sin tocar el resto de la app.
 * Solo renderizado; ninguna lógica de negocio se delega al proveedor de mapas.
 */
export function MapView({
  pointsById,
  stops = [],
  nextPointId,
  depotPointId,
  currentPosition,
}: MapViewProps) {
  // Construir polilínea en el orden de paradas
  const polylinePoints: [number, number][] = stops
    .filter((s) => {
      const p = pointsById[s.pointId];
      return p?.latitude != null && p?.longitude != null;
    })
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const p = pointsById[s.pointId];
      return [p.latitude!, p.longitude!] as [number, number];
    });

  // Centro del mapa: primer punto con coordenadas o posición actual
  const allPoints = Object.values(pointsById).filter(
    (p) => p.latitude != null && p.longitude != null
  );
  const center: [number, number] =
    currentPosition
      ? [currentPosition.lat, currentPosition.lng]
      : allPoints.length > 0
      ? [allPoints[0].latitude!, allPoints[0].longitude!]
      : [19.4326, -99.1332]; // CDMX como fallback

  return (
    <div className="map-wrapper">
      {!HAS_MAPBOX_TOKEN && (
        <p className="warning-text">
          ⚠️ Falta VITE_MAPBOX_TOKEN: se muestra el mapa de OpenStreetMap como respaldo.
        </p>
      )}
      <MapContainer center={center} zoom={13} className="map-container" scrollWheelZoom>
        {HAS_MAPBOX_TOKEN ? (
          <TileLayer
            attribution={MAPBOX_ATTRIBUTION}
            url={MAPBOX_TILES_URL}
            tileSize={512}
            zoomOffset={-1}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {currentPosition && (
          <>
            <RecenterMap center={[currentPosition.lat, currentPosition.lng]} />
            <Marker
              position={[currentPosition.lat, currentPosition.lng]}
              icon={
                new L.DivIcon({
                  className: '',
                  html: '<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                })
              }
            >
              <Popup>Tu ubicación actual</Popup>
            </Marker>
          </>
        )}

        {polylinePoints.length > 1 && (
          <Polyline positions={polylinePoints} color="#3b82f6" weight={3} opacity={0.7} />
        )}

        {stops.map((stop) => {
          const point = pointsById[stop.pointId];
          if (!point?.latitude || !point?.longitude) return null;

          const isDepot = stop.pointId === depotPointId;
          const isNext = stop.pointId === nextPointId;
          const isVisited = stop.status === 'VISITED';

          let icon = pendingIcon;
          if (isDepot) icon = depotIcon;
          else if (isNext) icon = nextIcon;
          else if (isVisited) icon = visitedIcon;

          return (
            <Marker
              key={stop.pointId}
              position={[point.latitude, point.longitude]}
              icon={icon}
            >
              <Popup>
                <strong>{point.reference}</strong>
                {point.address && <div>{point.address}</div>}
                <div style={{ marginTop: 4 }}>
                  {isDepot && <span className="badge badge-depot">Depósito</span>}
                  {isNext && <span className="badge badge-next">Siguiente</span>}
                  {isVisited && <span className="badge badge-visited">Visitado</span>}
                  {!isDepot && !isNext && !isVisited && (
                    <span className="badge badge-pending">Pendiente</span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className="map-legend">
        <span className="legend-item legend-depot">◼ Depósito</span>
        <span className="legend-item legend-next">● Siguiente</span>
        <span className="legend-item legend-pending">📍 Pendiente</span>
        <span className="legend-item legend-visited">● Visitado</span>
        {currentPosition && <span className="legend-item legend-current">● Tú</span>}
      </div>
    </div>
  );
}
