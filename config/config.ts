/// <reference types="vite/client" />

export const CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY as string,
};
