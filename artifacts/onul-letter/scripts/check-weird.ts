import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
async function check() {
  const { data } = await supabase.from('entries').select('*').eq('id', 'ddda5eba-66ac-4379-af78-880ae2f938cb');
  if (data && data[0]) {
    for (const key in data[0]) {
      const val = data[0][key];
      let len = 0;
      if (typeof val === 'string') len = val.length;
      else if (val) len = JSON.stringify(val).length;
      
      if (len > 1000) {
        console.log(`${key} is HUGE! type: ${typeof val}, length: ${len}`);
        if (typeof val === 'string') {
          console.log(`Starts with: ${val.substring(0, 100)}`);
          console.log(`Ends with: ${val.substring(val.length - 100)}`);
        }
      }
    }
  }
}
check();
