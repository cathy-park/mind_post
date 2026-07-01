import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');
async function check() {
  const { data: ids } = await supabase.from('entries').select('id');
  if (!ids) return;
  for (const row of ids) {
    const start = Date.now();
    const { error } = await supabase.from('entries').select('*').eq('id', row.id);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.log(`Row ${row.id} took ${duration}ms!`);
    } else {
      console.log(`Row ${row.id} OK (${duration}ms)`);
    }
  }
}
check();
