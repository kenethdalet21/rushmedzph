/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ADMIN_URL?: string;
  readonly VITE_DOCTOR_APP_URL?: string;
  readonly VITE_DRIVER_APP_URL?: string;
  readonly VITE_MERCHANT_APP_URL?: string;
  readonly VITE_USER_APP_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
