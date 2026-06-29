import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

async function run() {
  const bucket = 'journal-photos';
  console.log(`Starting compression for bucket: ${bucket}`);

  let totalProcessed = 0;
  let totalSavedBytes = 0;

  const { data: list, error } = await supabase.storage.from(bucket).list('', { limit: 1000 });
  
  if (error) {
    console.error('Error listing root:', error);
    return;
  }
  
  for (const folder of list) {
    if (folder.id === null) {
      // It's a folder (userId)
      const { data: files, error: filesError } = await supabase.storage.from(bucket).list(folder.name, { limit: 1000 });
      if (filesError) continue;

      for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue;
        const filePath = `${folder.name}/${file.name}`;
        
        // Skip files that are already small (e.g. < 200KB) and likely WebP
        if (file.metadata?.size && file.metadata.size < 200 * 1024 && file.metadata?.mimetype?.includes('webp')) {
          console.log(`Skipping ${filePath} (already small/webp)`);
          continue;
        }

        console.log(`Processing ${filePath} (${Math.round((file.metadata?.size || 0) / 1024)} KB)...`);
        
        const { data: fileData, error: downloadError } = await supabase.storage.from(bucket).download(filePath);
        if (downloadError || !fileData) {
          console.error(` Failed to download ${filePath}:`, downloadError);
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        
        try {
          const compressed = await compressImage(buffer);
          
          if (compressed.length >= buffer.length) {
             console.log(` Skipping ${filePath} (compression didn't reduce size)`);
             continue;
          }

          const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, compressed, {
            contentType: 'image/webp',
            upsert: true,
          });

          if (uploadError) {
             console.error(` Failed to upload ${filePath}:`, uploadError);
          } else {
             const saved = buffer.length - compressed.length;
             totalSavedBytes += saved;
             totalProcessed++;
             console.log(` Success! Saved ${Math.round(saved / 1024)} KB.`);
          }
        } catch (e) {
          console.error(` Failed to compress ${filePath}:`, e);
        }
      }
    } else {
      // It's a file in root
      const filePath = folder.name;
      // Skip if already small webp
      if (folder.metadata?.size && folder.metadata.size < 200 * 1024 && folder.metadata?.mimetype?.includes('webp')) continue;
      
      console.log(`Processing root file ${filePath}...`);
      const { data: fileData } = await supabase.storage.from(bucket).download(filePath);
      if (!fileData) continue;
      
      const buffer = Buffer.from(await fileData.arrayBuffer());
      try {
        const compressed = await compressImage(buffer);
        if (compressed.length < buffer.length) {
          await supabase.storage.from(bucket).upload(filePath, compressed, { contentType: 'image/webp', upsert: true });
          totalSavedBytes += (buffer.length - compressed.length);
          totalProcessed++;
        }
      } catch(e) {}
    }
  }

  console.log('\n=====================================');
  console.log(`Compression complete!`);
  console.log(`Processed files: ${totalProcessed}`);
  console.log(`Total storage saved: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log('=====================================');
}

run();
