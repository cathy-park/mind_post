import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  for (const bucket of ['journal-photos', 'journal-audios']) {
    let totalSize = 0;
    let count = 0;
    const { data: list, error } = await supabase.storage.from(bucket).list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } });
    
    if (error) {
      console.error(error);
      continue;
    }
    
    for (const folder of list) {
      if (folder.id === null) {
        // It's a folder (userId)
        const { data: files } = await supabase.storage.from(bucket).list(folder.name, { limit: 1000 });
        for (const file of files || []) {
          totalSize += file.metadata?.size || 0;
          count++;
        }
      } else {
        totalSize += folder.metadata?.size || 0;
        count++;
      }
    }
    console.log(`Bucket ${bucket}: ${count} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }
}
check();
