import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');

async function run() {
  const { data: ids } = await supabase.from('entries').select('id');
  if (!ids) return;
  for (const row of ids) {
    const { data } = await supabase.from('entries').select('photo_url, audio_url, audio_urls, long_answer').eq('id', row.id);
    if (!data || !data[0]) continue;
    const entry = data[0];
    let update = {} as any;
    
    for (const key of ['photo_url', 'audio_url', 'audio_urls', 'long_answer']) {
      const val = entry[key];
      if (val) {
        const str = JSON.stringify(val);
        if (str.length > 100000) { // over 100KB
          console.log(`Row ${row.id} has huge ${key} (${str.length} bytes), clearing it...`);
          update[key] = null;
        }
      }
    }
    
    if (Object.keys(update).length > 0) {
      await supabase.from('entries').update(update).eq('id', row.id);
      console.log(`Cleared for ${row.id}`);
    }
  }
  console.log('Done!');
}
run();
