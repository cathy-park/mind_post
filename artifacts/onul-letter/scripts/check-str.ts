import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
async function check() {
  const { data } = await supabase.from('entries').select('photo_url').eq('id', 'ddda5eba-66ac-4379-af78-880ae2f938cb');
  if (data && data[0]) {
    try {
      const arr = JSON.parse(data[0].photo_url);
      console.log('String length:', arr[0].length);
      console.log('Substring:', arr[0].substring(0, 100));
      console.log('Contains base64?', arr[0].includes('base64'));
    } catch(e) {}
  }
}
check();
