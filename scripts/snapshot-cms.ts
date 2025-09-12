import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSnapshot } from '@/lib/cms-cache';

async function run() {
  const snapshot = await buildSnapshot();
  const out = path.join(process.cwd(), 'public', 'cms-snapshot.json');
  await writeFile(out, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log('CMS snapshot saved to', out);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});