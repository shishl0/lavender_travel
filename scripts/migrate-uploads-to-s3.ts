/*
  scripts/migrate-uploads-to-s3.ts

  1) Uploads all files from public/uploads -> S3 at keys `uploads/<filename>`
  2) Rewrites DB URLs that start with `/uploads/` to absolute S3 URLs

  Usage:
    npm run prisma:generate
    tsx scripts/migrate-uploads-to-s3.ts

  Env required:
    S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION, S3_BUCKET, S3_PUBLIC_URL_BASE
*/

import "dotenv/config"; // load .env for S3_*/AWS_* creds when running with tsx/node

import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { s3PutObject, publicUrlForKey, getUploadPrefix } from '@/lib/s3';

const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string, rel = '') {
    let entries: any[] = [];
    try { entries = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      const r = path.join(rel, e.name);
      if (e.isDirectory()) await walk(p, r);
      else out.push(r);
    }
  }
  await walk(dir);
  return out;
}

function contentTypeByExt(f: string): string {
  const ext = f.toLowerCase();
  if (ext.endsWith('.png')) return 'image/png';
  if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) return 'image/jpeg';
  if (ext.endsWith('.webp')) return 'image/webp';
  if (ext.endsWith('.gif')) return 'image/gif';
  if (ext.endsWith('.heic') || ext.endsWith('.heif')) return 'image/heic';
  if (ext.endsWith('.avif')) return 'image/avif';
  if (ext.endsWith('.tiff') || ext.endsWith('.tif')) return 'image/tiff';
  if (ext.endsWith('.pdf')) return 'application/pdf';
  if (ext.endsWith('.doc')) return 'application/msword';
  if (ext.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'application/octet-stream';
}

function rewriteUrl(u?: string | null): string | null {
  if (!u || typeof u !== 'string') return u ?? null;
  if (!u.startsWith('/uploads/')) return u;
  const rest = u.replace(/^\/uploads\//, '');
  const key = `${getUploadPrefix()}/${rest}`;
  return publicUrlForKey(key);
}

async function uploadAll() {
  try { await fs.access(UPLOADS_DIR); } catch {
    console.log('No local uploads directory. Nothing to upload.');
    return;
  }
  const files = await listFiles(UPLOADS_DIR);
  console.log('Found', files.length, 'files');
  let ok = 0; let fail = 0;
  for (const r of files) {
    const abs = path.join(UPLOADS_DIR, r);
    try {
      const b = await fs.readFile(abs);
      const key = path.posix.join(getUploadPrefix(), r.split(path.sep).join('/'));
      const ct = contentTypeByExt(r);
      await s3PutObject(key, b, ct);
      ok++;
      if (ok % 50 === 0) console.log('Uploaded', ok, 'files...');
    } catch (e) {
      fail++;
      console.warn('Failed upload', r, e);
    }
  }
  console.log('Upload complete:', { ok, fail });
}

async function rewriteDb() {
  // SiteSettings
  const settings = await prisma.siteSettings.findMany();
  for (const s of settings) {
    const og = rewriteUrl(s.ogImageUrl);
    const cert = rewriteUrl(s.certificateUrl);
    const patch: any = {};
    if (og !== s.ogImageUrl) patch.ogImageUrl = og;
    if (cert !== s.certificateUrl) patch.certificateUrl = cert;
    if (Object.keys(patch).length) await prisma.siteSettings.update({ where: { id: s.id }, data: patch });
  }

  // Hero
  const heroes = await prisma.hero.findMany();
  for (const h of heroes) {
    const url = rewriteUrl(h.imageUrl);
    if (url !== h.imageUrl) await prisma.hero.update({ where: { id: h.id }, data: { imageUrl: url } });
  }

  // Destinations
  const dests = await prisma.destination.findMany();
  for (const d of dests) {
    const patch: any = {};
    const img = rewriteUrl(d.imageUrl);
    if (img !== d.imageUrl) patch.imageUrl = img;

    const heros = (d.heroImages || []).map(rewriteUrl) as (string | null)[];
    if (heros.length && heros.some((x, i) => x !== d.heroImages[i])) patch.heroImages = heros.filter(Boolean);

    // poi (Json)
    try {
      const poi = Array.isArray(d.poi) ? d.poi as any[] : [];
      let changed = false;
      const next = poi.map((p) => {
        if (p && typeof p === 'object' && typeof p.imageUrl === 'string' && p.imageUrl.startsWith('/uploads/')) {
          const nu = rewriteUrl(p.imageUrl);
          if (nu !== p.imageUrl) { changed = true; return { ...p, imageUrl: nu }; }
        }
        return p;
      });
      if (changed) patch.poi = next as any;
    } catch {}

    if (Object.keys(patch).length) await prisma.destination.update({ where: { id: d.id }, data: patch });
  }

  // Reviews
  const reviews = await prisma.review.findMany();
  for (const r of reviews) {
    const arr = (r.images || []).map(rewriteUrl) as (string | null)[];
    if (arr.some((x, i) => x !== r.images[i])) {
      await prisma.review.update({ where: { id: r.id }, data: { images: arr.filter(Boolean) as string[] } });
    }
  }
}

async function main() {
  console.log('\n--- S3 migrate: upload files ---');
  await uploadAll();
  console.log('\n--- S3 migrate: rewrite DB URLs ---');
  await rewriteDb();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
