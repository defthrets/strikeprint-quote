// Content store — single gallery.json file in Vercel Blob holds the
// admin-managed photo list. Read on every API call (cheap; tiny file),
// re-uploaded on every write. Single-admin so no concurrency concerns.
import { put, head, list } from '@vercel/blob';
import { SEED_PHOTOS } from './seeds.js';

const GALLERY_KEY = 'gallery.json';

function newId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function readGallery() {
  // Look up the blob by pathname — head() returns metadata + URL
  try {
    const meta = await head(GALLERY_KEY);
    if (!meta?.url) return await seedGallery();
    const r = await fetch(meta.url, { cache: 'no-store' });
    if (!r.ok) return await seedGallery();
    const json = await r.json();
    if (!json || !Array.isArray(json.photos)) return await seedGallery();
    return json;
  } catch (err) {
    // Blob doesn't exist yet — first read seeds it. @vercel/blob throws
    // BlobNotFoundError; check that, plus a couple of fallbacks for safety.
    const isNotFound = err?.name === 'BlobNotFoundError'
                    || err?.status === 404
                    || /not[\s\-]?found|does not exist|404/i.test(err?.message || '');
    if (isNotFound) return await seedGallery();
    console.error('readGallery error', err);
    return { version: 1, photos: [] };
  }
}

export async function writeGallery(gallery) {
  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    photos: gallery.photos || []
  };
  await put(GALLERY_KEY, JSON.stringify(payload, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
  return payload;
}

async function seedGallery() {
  const photos = SEED_PHOTOS.map((p, i) => ({
    id: newId(),
    url: p.src,
    label: p.label,
    order: i,
    seed: true,
    createdAt: new Date().toISOString()
  }));
  return await writeGallery({ photos });
}

// Helpers used by API endpoints
export function makeId() { return newId(); }
