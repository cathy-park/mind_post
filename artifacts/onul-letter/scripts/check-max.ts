import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
async function check() {
  const { data, error } = await supabase.from('entries').select('id, audio_url, audio_urls, photo_url');
  if (data) {
    let max = 0;
    let maxId = '';
    for (const row of data) {
      const len = JSON.stringify(row).length;
      if (len > max) { max = len; maxId = row.id; }
    }
    console.log(`Max row length is ${max} bytes for ID ${maxId}`);
  }
}
check();
