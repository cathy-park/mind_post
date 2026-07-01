import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const url = `${supabaseUrl}/rest/v1/entries?select=id&limit=1`;
  
  console.log('Fetching:', url);
  const resp = await fetch(url, {
    headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` }
  });
  console.log('Status:', resp.status);
  console.log('Text:', await resp.text());
}
check();
