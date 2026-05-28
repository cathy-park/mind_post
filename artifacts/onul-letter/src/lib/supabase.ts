import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key must be set in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Eagerly restore the auth session as early as possible (module load),
// so by the time components mount the session is already in flight.
supabase.auth.getSession();

export type { User, Session } from '@supabase/supabase-js';
