import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function decodeBase64(dataUri: string) {
  const [header, data] = dataUri.split(',');
  if (!header || !data) return null;
  const mimeType = header.match(/:(.*?);/)?.[1];
  if (!mimeType) return null;
  const ext = mimeType.split('/')[1] || 'bin';
  const buffer = Buffer.from(data, 'base64');
  return { buffer, mimeType, ext };
}

async function runMigration() {
  console.log("Starting migration...");

  const { data: entries, error: fetchError } = await supabase
    .from('entries')
    .select('id, user_id, entry_date, photo_url, audio_url');

  if (fetchError) {
    console.error("Failed to fetch entries:", fetchError);
    return;
  }

  if (!entries || entries.length === 0) {
    console.log("No entries found. Migration complete.");
    return;
  }

  console.log(`Found ${entries.length} entries. Checking for Base64 media...`);

  let migratedPhotos = 0;
  let migratedAudios = 0;

  for (const entry of entries) {
    const updates: any = {};

    // Check photo_url
    if (entry.photo_url && entry.photo_url.startsWith('data:image/')) {
      console.log(`Migrating photo for entry ${entry.id}...`);
      const decoded = decodeBase64(entry.photo_url);
      if (decoded) {
        const filePath = `${entry.user_id}/${entry.entry_date}-${Date.now()}-migrated.${decoded.ext}`;
        const { error: uploadError } = await supabase.storage
          .from('journal-photos')
          .upload(filePath, decoded.buffer, { contentType: decoded.mimeType, upsert: true });

        if (uploadError) {
          console.error(`Failed to upload photo for entry ${entry.id}:`, uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('journal-photos')
            .getPublicUrl(filePath);
          updates.photo_url = publicUrl;
          migratedPhotos++;
        }
      }
    }

    // Check audio_url
    if (entry.audio_url && entry.audio_url.startsWith('data:audio/')) {
      console.log(`Migrating audio for entry ${entry.id}...`);
      const decoded = decodeBase64(entry.audio_url);
      if (decoded) {
        const filePath = `${entry.user_id}/${entry.entry_date}-${Date.now()}-migrated.${decoded.ext}`;
        const { error: uploadError } = await supabase.storage
          .from('journal-audios')
          .upload(filePath, decoded.buffer, { contentType: decoded.mimeType, upsert: true });

        if (uploadError) {
          console.error(`Failed to upload audio for entry ${entry.id}:`, uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('journal-audios')
            .getPublicUrl(filePath);
          updates.audio_url = publicUrl;
          migratedAudios++;
        }
      }
    }

    // Update DB if there are changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('entries')
        .update(updates)
        .eq('id', entry.id);
      
      if (updateError) {
        console.error(`Failed to update DB for entry ${entry.id}:`, updateError);
      } else {
        console.log(`Successfully updated entry ${entry.id} in DB.`);
      }
    }
  }

  console.log("===================================");
  console.log("Migration finished.");
  console.log(`Total photos migrated: ${migratedPhotos}`);
  console.log(`Total audios migrated: ${migratedAudios}`);
}

runMigration().catch(console.error);
