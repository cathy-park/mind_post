import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('entries').select('id, photo_url, audio_url, long_answer').limit(5);
  
  if (data) {
    for (const row of data) {
      console.log(`ID: ${row.id}`);
      console.log(`photo_url length: ${row.photo_url?.length || 0}`);
      console.log(`audio_url length: ${row.audio_url?.length || 0}`);
      console.log(`long_answer length: ${row.long_answer?.length || 0}`);
      if (row.photo_url?.length > 1000) {
        console.log(`photo_url preview: ${row.photo_url.substring(0, 50)}...`);
      }
      console.log('---');
    }
  }
}
check();
