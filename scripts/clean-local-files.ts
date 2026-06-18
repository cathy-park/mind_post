import { existsSync, unlinkSync } from 'fs';

const filesToDelete = [
  '.env.production.local',
  '.env.test.local',
  '.replit',
  '.vercel',
];

filesToDelete.forEach((path) => {
  if (existsSync(path)) {
    try {
      unlinkSync(path);
      console.log(`Deleted ${path}`);
    } catch (e) {
      console.error(`Failed to delete ${path}:`, e);
    }
  } else {
    console.log(`File not found: ${path}`);
  }
});
