import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const startTime = Date.now();
  
  console.log('Fetching entries...');
  const { data: entries, error: err1 } = await supabase
    .from('entries')
    .select('*')
    .order('entry_date', { ascending: false });
    
  console.log(`Entries fetched in ${Date.now() - startTime}ms`, err1);
  
  const startTime2 = Date.now();
  console.log('Fetching comments...');
  const { data: comments, error: err2 } = await supabase
    .from('reflection_comments')
    .select('*');
    
  console.log(`Comments fetched in ${Date.now() - startTime2}ms`, err2);
}
check();
