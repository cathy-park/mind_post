import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
async function check() {
  const startTime = Date.now();
  const { data, error } = await supabase.from('entries').select('id').limit(10);
  console.log(`Took ${Date.now() - startTime}ms`, error);
}
check();
