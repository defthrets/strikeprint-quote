// Content store — single gallery.json file in Vercel Blob holds the
// admin-managed photo list. Read on every API call (cheap; tiny file),
// re-uploaded on every write. Single-admin so no concurrency concerns.
import { put, head, list } from '@vercel/blob';
import { SEED_PHOTOS } from './seeds.js';

const GALLERY_KEY = 'gallery.json';

function newId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Backfill mapping: human-readable label → service-category slug.
// Used to migrate gallery entries that pre-date the category/featured
// schema (i.e. were seeded before this change shipped). On read, any
// entry missing a `category` field gets one inferred from its label
// — keeps the homepage populated without forcing the admin to retag
// every photo manually.
const LABEL_TO_CATEGORY = {
  'Storefront signage':      'shopfront',
  'Tradie signage':          'shopfront',
  'Bar graphics':            'illuminated',
  'Illuminated bar graphics':'illuminated',
  'Illuminated storefront':  'illuminated',
  'Lightbox':                'illuminated',
  'Vehicle wrap':            'vehicle',
  'Vending wrap':            'vehicle',
  'Banners':                 'banners',
  'Hanging fabric banners':  'banners',
  'Panels & promotional':    'banners',
  'Panels and promotional':  'banners',
  'Panels & acrylics':       'banners',
  'Wall mural':              'graphics',
  'Wall graphics':           'graphics',
  'Privacy film':            'graphics',
  'Custom privacy frosting': 'graphics',
  'Window vinyl graphics':   'graphics',
  'Custom vinyl':            'graphics',
  'Inhouse production':      'pylons'
};

function migratePhoto(p) {
  // Already migrated? leave it alone.
  if (p.category !== undefined) return p;
  const inferred = LABEL_TO_CATEGORY[p.label] || null;
  return {
    ...p,
    category: inferred,
    featured: !!p.featured  // default false; admin picks the cover via UI
  };
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
    // Inline migrations on read (cheap; pure JS) — next write persists.
    //   1) photos without `category` get one inferred from their label
    //   2) `services`/`hero`/`contact` override maps default to {} when
    //      absent (so callers don't need to null-guard)
    return {
      ...json,
      photos:   json.photos.map(migratePhoto),
      services: json.services || {},
      hero:     json.hero     || {},
      contact:  json.contact  || {}
    };
  } catch (err) {
    // Blob doesn't exist yet — first read seeds it. @vercel/blob throws
    // BlobNotFoundError; check that, plus a couple of fallbacks for safety.
    const isNotFound = err?.name === 'BlobNotFoundError'
                    || err?.status === 404
                    || /not[\s\-]?found|does not exist|404/i.test(err?.message || '');
    if (isNotFound) return await seedGallery();
    console.error('readGallery error', err);
    return { version: 1, photos: [], services: {}, hero: {}, contact: {} };
  }
}

export async function writeGallery(gallery) {
  const payload = {
    version: 2, // bumped when content overrides were added
    updatedAt: new Date().toISOString(),
    photos:   gallery.photos   || [],
    // Sparse override maps. Empty objects when admin hasn't touched them.
    services: gallery.services || {},
    hero:     gallery.hero     || {},
    contact:  gallery.contact  || {}
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
    category: p.category || null,
    featured: !!p.featured,
    order: i,
    seed: true,
    createdAt: new Date().toISOString()
  }));
  return await writeGallery({ photos });
}

// Helpers used by API endpoints
export function makeId() { return newId(); }
