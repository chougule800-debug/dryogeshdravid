import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase single source of truth.
 *
 * The frontend uses only the anon/public key — never a service-role key. Privileged
 * operations (e.g. the seed script) run server-side and read the service-role key from
 * server environment variables.
 *
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are read from the environment (see .env.example).
 * If they are absent the client throws, and the app surfaces a connection error rather than
 * silently falling back to any local/hardcoded data.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (e.g. in .env).'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/** Storage bucket used for all website images. */
export const IMAGE_BUCKET = 'clinic-images';

/** Build a public URL for an object inside the clinic-images bucket. */
export function getPublicStorageUrl(path: string): string {
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
