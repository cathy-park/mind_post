import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error, count } = await supabase.from('entries').select('*', { count: 'exact', head: true });
  console.log('Entries count:', count, 'Error:', error);
  
  const { data: recent } = await supabase.from('entries').select('id, entry_date').order('created_at', { ascending: false }).limit(5);
  console.log('Recent entries:', recent);
}
check();
