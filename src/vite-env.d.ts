/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_RECALCULATE_INTERVAL_MS: string;
  readonly VITE_USE_MOCK_503?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
