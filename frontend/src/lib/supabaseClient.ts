import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (typeof supabaseUrl !== 'string' || supabaseUrl.length === 0) {
  console.warn('[supabase] VITE_SUPABASE_URL eksik');
}
if (typeof supabaseAnonKey !== 'string' || supabaseAnonKey.length === 0) {
  console.warn('[supabase] VITE_SUPABASE_ANON_KEY eksik');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});