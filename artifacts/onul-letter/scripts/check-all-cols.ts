import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
async function check() {
  const { data, error } = await supabase.from('entries').select('*').limit(1);
  if (data) {
    for (const key in data[0]) {
      console.log(`${key}: type ${typeof data[0][key]}, length ${JSON.stringify(data[0][key])?.length}`);
    }
  }
}
check();
