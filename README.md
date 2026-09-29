# Routes App — Frontend

Frontend React para el **Routes Optimization Service** (backend Spring Boot). Permite a un chofer/repartidor registrar puntos de entrega, calcular una ruta óptima y seguirla en tiempo real desde el celular.

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18 |
| npm | 9 |

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Arrancar en modo desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`.

---

## Variables de entorno

Todas las variables están en `.env.example`. Copia el archivo a `.env` y ajusta los valores:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | URL base del backend Spring Boot (sin `/` al final) | `http://localhost:8080` |
| `VITE_USE_MOCK` | `true` activa el mock MSW; `false` usa el backend real | `false` |
| `VITE_RECALCULATE_INTERVAL_MS` | Intervalo de polling del recálculo (ms) | `30000` |

> **Nota:** `.env` está en `.gitignore` y nunca se versiona. Solo `.env.example` va al repositorio.

---

## Correr con mock (sin backend)

```bash
# 1. Editar .env
VITE_USE_MOCK=true

# 2. Inicializar el Service Worker de MSW (solo la primera vez)
npx msw init public/ --save

# 3. Arrancar
npm run dev
```

Los 5 endpoints del contrato están simulados, incluyendo errores 400 (parada fuera de orden, payload inválido), 404 y 503.

Para forzar un error 503 en el endpoint `/optimize`:

```bash
VITE_USE_MOCK_503=true
```

---

## Correr con backend real

```bash
# Asegúrate de que el backend Spring está corriendo en localhost:8080
# o ajusta VITE_API_BASE_URL en .env

VITE_USE_MOCK=false
npm run dev
```

---

## Tests

```bash
# Ejecutar tests (Vitest + Testing Library)
npm run test

# Modo watch
npm run test:watch
```

Los tests cubren:
- Validación del formulario de puntos (`DeliveryPointForm.test.tsx`)
- Desenvoltura de `ApiResponse` y mapeo de errores (`httpClient.test.ts`)
- Cálculo del siguiente destino (`routeUtils.test.ts`)

---

## Build de producción

```bash
npm run build
# Los archivos se generan en dist/

npm run preview
# Sirve el build localmente
```

---

## Lint

```bash
npm run lint
```

---

## Estructura de carpetas

```
src/
├── App.tsx               # Componente raíz, navegación entre vistas
├── App.css               # Estilos globales (mobile-first)
├── main.tsx              # Punto de entrada; activa MSW si VITE_USE_MOCK=true
│
├── config/
│   └── index.ts          # Única fuente de verdad para variables de entorno
│
├── models/
│   └── index.ts          # Interfaces TypeScript que espejean los DTO de Spring
│
├── services/
│   ├── httpClient.ts     # Cliente HTTP centralizado (fetch); desenvuelve ApiResponse
│   ├── deliveryPointService.ts
│   └── routeService.ts
│
├── hooks/
│   ├── useAsync.ts              # Hook genérico para llamadas asíncronas
│   ├── useGeolocation.ts        # Geolocation API con manejo de permisos
│   └── useRecalculatePolling.ts # Polling periódico de recálculo
│
├── utils/
│   ├── format.ts         # Conversiones metros→km, segundos→min (SOLO presentación)
│   └── routeUtils.ts     # getNextStop, validateReference, validateLocation
│
├── components/
│   ├── DeliveryPointForm.tsx  # Formulario de captura (FE-004)
│   ├── PointList.tsx          # Lista de puntos capturados (FE-005)
│   ├── MapView.tsx            # Mapa encapsulado Leaflet+OSM (FE-010/011)
│   ├── RouteResult.tsx        # Resultado de ruta: paradas, distancia, tiempo (FE-009)
│   ├── LoadingSpinner.tsx
│   ├── ErrorMessage.tsx
│   └── Toast.tsx
│
├── views/
│   ├── CaptureView.tsx       # Captura de puntos y cálculo (FE-004..007)
│   ├── ActiveRouteView.tsx   # Ruta activa: mapa, siguiente destino, marcar visitada (FE-009..013)
│   └── HistoryView.tsx       # Historial paginado (FE-016)
│
├── mocks/
│   ├── handlers.ts       # Handlers MSW que simulan los 5 endpoints
│   └── browser.ts        # Setup del Service Worker
│
└── tests/
    ├── setup.ts
    ├── DeliveryPointForm.test.tsx
    ├── httpClient.test.ts
    └── routeUtils.test.ts
```

---

## Decisiones tomadas

### Tecnología de mapas
**Leaflet + OpenStreetMap** (`react-leaflet`). Se eligió como opción por defecto porque:
- Es libre, gratuita y sin necesidad de API key.
- El contrato del backend no especifica un proveedor de mapas.
- El componente `MapView` encapsula toda la lógica del mapa detrás de una abstracción; cambiar el proveedor solo requiere modificar ese archivo.

> Para usar Google Maps u otro proveedor: reemplaza `MapView.tsx` manteniendo la misma interfaz de props (`pointsById`, `stops`, `nextPointId`, `depotPointId`, `currentPosition`).

### Estado local vs. store global
Se usa estado local en `App.tsx` para los puntos capturados y la ruta activa. No se agregó Redux/Zustand para mantener la solución simple; si el proyecto crece, el estado de `pointsById` puede migrarse fácilmente a un store.

### Sin endpoint de consulta de puntos
El backend no expone un endpoint para listar puntos de entrega. El frontend mantiene en memoria un `Record<string, DeliveryPointResponse>` (keyed por `id`) para resolver `pointId → referencia/dirección/coordenadas` en las vistas de ruta.

### Depósito por defecto
El primer punto capturado se marca automáticamente como depósito. El usuario puede cambiar el depósito en cualquier momento desde la lista de puntos.

### Polling de recálculo
Intervalo configurable con `VITE_RECALCULATE_INTERVAL_MS` (default 30 s). El polling se detiene automáticamente cuando la ruta llega a `COMPLETED` o el componente se desmonta.

### MSW en modo mock
Los mocks están aislados en `src/mocks/` y solo se importan dinámicamente si `VITE_USE_MOCK=true`. El código de producción no los referencia.

---

## Checklist de issues

| Issue | Criterio | Estado |
|---|---|---|
| FE-001 | Proyecto Vite+React+TS arranca sin errores; estructura de carpetas creada; config externa | ✅ Cumplido |
| FE-002 | Modelos coinciden campo por campo con los DTO de Spring | ✅ Cumplido |
| FE-003 | Cliente HTTP centralizado; desenvuelve `ApiResponse`; errores tipados con mensajes en español | ✅ Cumplido |
| FE-004 | Formulario con reference, address/coords, ventana de tiempo; produce `DeliveryPointRequest` exacto | ✅ Cumplido |
| FE-005 | Lista con orden de captura estable; IDs solo en modo debug | ✅ Cumplido |
| FE-006 | Botón "Calcular" deshabilitado si hay punto inválido; `LOCATION_INVALID` interpretado | ✅ Cumplido |
| FE-007 | Selector DISTANCE/TIME; validación mínimo 2 puntos + depósito; estado CALCULATING; manejo 400/503 | ✅ Cumplido |
| FE-009 | Paradas en orden del backend; distancia/tiempo convertidos solo en presentación | ✅ Cumplido |
| FE-010 | `MapView` encapsulado e intercambiable; Leaflet+OSM; no lógica de negocio en el proveedor | ✅ Cumplido |
| FE-011 | Marcadores visuales distintos por estado (PENDING/ACTUAL/VISITED/DEPOT); siguiente destino claro | ✅ Cumplido |
| FE-012 | Geolocation con manejo de denegado; botón "Marcar visitada"; actualización con `RouteResponse`; aviso COMPLETED | ✅ Cumplido |
| FE-013 | Polling periódico configurable; aviso no intrusivo; sin recaptura de paradas | ✅ Cumplido |
| FE-014 | Siguiente parada y botón "Marcar visitada" siempre visibles (máx. 2 interacciones) | ✅ Cumplido |
| FE-015 | Mobile-first; controles ≥ 44px; `<meta name="viewport">`; responsive 600px+ | ✅ Cumplido |
| FE-016 | Historial paginado; solo lectura; muestra fecha, paradas, distancia, tiempo | ✅ Cumplido |

---

## Reglas críticas verificadas

- ✅ No hay URLs hardcodeadas (todas van por `config.apiBaseUrl`)
- ✅ No hay llamadas directas a Python ni a proveedor de mapas para lógica de negocio
- ✅ `pointIds` se envía en el orden de captura, sin reordenar
- ✅ La ruta no se recalcula en React; el orden siempre lo dicta el backend
- ✅ Las conversiones de unidades (metros/segundos) solo ocurren en `src/utils/format.ts`
- ✅ Los modelos coinciden campo por campo con los DTO del contrato
- ✅ `.env` no versionado; solo `.env.example`
