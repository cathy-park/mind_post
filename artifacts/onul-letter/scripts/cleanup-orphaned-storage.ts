import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Supabase URL or service role key missing in env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

type Report = {
  removed: string[];
  errors: string[];
};

async function getUsedPaths(): Promise<Set<string>> {
  const used = new Set<string>();
  const { data, error } = await supabase.from('entries').select('photo_url');
  if (error) {
    console.error('Failed to fetch entries:', error);
    return used;
  }
  data?.forEach((e: any) => {
    if (e.photo_url) {
      const p = extractPath(e.photo_url);
      if (p) used.add(`journal-photos/${p}`);
    }
  });
  return used;
}

function extractPath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const parts = url.pathname.split('/');
    const idx = parts.indexOf('public');
    if (idx >= 0 && parts.length > idx + 1) {
      return parts.slice(idx + 2).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

async function cleanupBucket(bucket: string, used: Set<string>, report: Report) {
  const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });
  if (error) {
    report.errors.push(`List error in ${bucket}: ${error.message}`);
    return;
  }
  const allFiles = data?.map((f) => f.name) ?? [];
  const toDelete = allFiles.filter((p) => !used.has(`${bucket}/${p}`));
  if (toDelete.length === 0) {
    console.log(`No orphan files in ${bucket}`);
    return;
  }
  const { error: delErr } = await supabase.storage.from(bucket).remove(toDelete);
  if (delErr) {
    report.errors.push(`Delete error in ${bucket}: ${delErr.message}`);
  } else {
    report.removed.push(...toDelete.map((p) => `${bucket}/${p}`));
    console.log(`Deleted ${toDelete.length} files from ${bucket}`);
  }
}

async function main() {
  const used = await getUsedPaths();
  const report: Report = { removed: [], errors: [] };
  await cleanupBucket('journal-photos', used, report);
  await cleanupBucket('journal-audios', used, report);
  writeFileSync('cleanup-orphan-report.json', JSON.stringify(report, null, 2));
  console.log('Cleanup completed. Report saved to cleanup-orphan-report.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
