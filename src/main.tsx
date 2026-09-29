import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { config } from './config';

async function startApp() {
  // Activar MSW solo si VITE_USE_MOCK=true (no afecta código de producción)
  if (config.useMock) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
    console.info('[Mock] MSW activado — usando backend simulado.');
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

startApp();
