import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

if (import.meta.env.DEV && !isSupabaseConfigured) {
  console.error(
    "[auth] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Authentication is disabled.",
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
