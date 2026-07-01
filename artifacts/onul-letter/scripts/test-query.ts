import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Use anon key to trigger RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Testing complex query with anon key...');
  
  // Note: we need a user token to pass RLS, otherwise it just returns [] instantly.
  // We can login with a dummy user or just observe if it's slow.
  
  const startTime = Date.now();
  const { data, error } = await supabase
    .from('entries')
    .select('*, reflection_comments(*)')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });
    
  console.log(`Took ${Date.now() - startTime}ms`);
  console.log('Result:', data?.length, error);
}
check();
