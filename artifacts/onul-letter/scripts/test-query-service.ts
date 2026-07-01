import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const startTime = Date.now();
  const { data, error } = await supabase
    .from('entries')
    .select('*, reflection_comments(*)')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });
    
  console.log(`Service key query took ${Date.now() - startTime}ms`);
  console.log('Result:', data?.length, error);
}
check();
