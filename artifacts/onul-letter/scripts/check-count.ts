import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
async function check() {
  const { count, error } = await supabase.from('entries').select('*', { count: 'exact', head: true });
  console.log('Total count bypassing RLS:', count, error);
}
check();
