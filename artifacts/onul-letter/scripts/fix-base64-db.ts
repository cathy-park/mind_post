import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');

async function fix() {
  console.log('Fetching ids...');
  const { data: ids } = await supabase.from('entries').select('id');
  if (!ids) return;
  
  for (const row of ids) {
    const { data } = await supabase.from('entries').select('*').eq('id', row.id);
    if (!data || !data[0]) continue;
    const entry = data[0];
    
    let needsUpdate = false;
    let newPhotoUrl = entry.photo_url;
    
    if (newPhotoUrl && newPhotoUrl.startsWith('data:')) {
      console.log(`Fixing photo for ${row.id}... length: ${newPhotoUrl.length}`);
      const [header, b64data] = newPhotoUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      const ext = mimeType.split('/')[1] ?? 'jpg';
      const buf = Buffer.from(b64data, 'base64');
      
      const path = `${entry.user_id}/${entry.entry_date}-${Date.now()}-fixed.${ext}`;
      const { error: upErr } = await supabase.storage.from('journal-photos').upload(path, buf, { contentType: mimeType });
      if (upErr) {
        console.error('Upload failed:', upErr);
        newPhotoUrl = null;
      } else {
        const { data: { publicUrl } } = supabase.storage.from('journal-photos').getPublicUrl(path);
        newPhotoUrl = publicUrl;
        console.log('Uploaded as', publicUrl);
      }
      needsUpdate = true;
    }
    
    let newAudioUrl = entry.audio_url;
    if (newAudioUrl && newAudioUrl.startsWith('data:')) {
      console.log(`Fixing audio for ${row.id}... length: ${newAudioUrl.length}`);
      newAudioUrl = null; // Just clear audio if base64 to save time, or we can upload it.
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await supabase.from('entries').update({ photo_url: newPhotoUrl, audio_url: newAudioUrl }).eq('id', row.id);
      console.log(`Updated DB for ${row.id}`);
    }
  }
  console.log('Done!');
}
fix();
