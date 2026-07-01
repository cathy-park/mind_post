import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
async function check() {
  const { data } = await supabase.from('entries').select('*').eq('id', 'ddda5eba-66ac-4379-af78-880ae2f938cb');
  if (data && data[0]) {
    for (const key in data[0]) {
      console.log(`${key} length:`, JSON.stringify(data[0][key])?.length);
    }
  }
}
check();
