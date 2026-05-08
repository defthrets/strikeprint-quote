// Content store — single gallery.json file in Vercel Blob holds the
// admin-managed photo list + content overrides. Read on every API call
// (cheap; tiny file), re-uploaded on every write.
//
// Multi-admin (4 editors): writes go through `applyMutation()` which
// implements optimistic concurrency control via a `rev` counter. Each
// write increments rev; before persisting, we re-read and confirm the
// rev hasn't moved since our initial read. If it has, another admin
// wrote in the meantime — we discard our work and retry on top of the
// fresh state (with jittered backoff). Vercel Blob doesn't expose
// atomic CAS so a tiny TOCTTOU window remains between the re-check
// and the write, but it's milliseconds and acceptable for 4 editors.
import { put, head, list } from '@vercel/blob';
import { SEED_PHOTOS } from './seeds.js';

const GALLERY_KEY = 'gallery.json';

// Thrown by applyMutation after exhausting retries — handlers should
// map this to a 409 response so the client can show a "retry" message.
export class GalleryConflictError extends Error {
  constructor(message = 'Concurrent edit conflict') {
    super(message);
    this.code = 'CONFLICT';
  }
}

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
    // Cache-bust the blob URL — Vercel's public-blob CDN caches the
    // path-stable URL, so a fresh PATCH right after a previous one
    // would read stale gallery.json and clobber the previous change
    // (last-write-wins). Appending a unique query forces an origin
    // hit. Cheap because the blob itself is tiny.
    const sep = meta.url.includes('?') ? '&' : '?';
    const fresh = meta.url + sep + 'cb=' + Date.now();
    const r = await fetch(fresh, { cache: 'no-store' });
    if (!r.ok) return await seedGallery();
    const json = await r.json();
    if (!json || !Array.isArray(json.photos)) return await seedGallery();
    // Inline migrations on read (cheap; pure JS) — next write persists.
    //   1) photos without `category` get one inferred from their label
    //   2) `services`/`hero`/`contact` override maps default to {} when
    //      absent (so callers don't need to null-guard)
    return {
      ...json,
      photos:         json.photos.map(migratePhoto),
      // Per-slug overrides for service tile title/body
      services:       json.services       || {},
      // Flat-key sections (sparse — anything missing falls through to defaults)
      hero:           json.hero           || {},
      contact:        json.contact        || {},
      about:          json.about          || {},
      services_intro: json.services_intro || {},
      contact_intro:  json.contact_intro  || {},
      materials:      json.materials      || {},
      reviews:        json.reviews        || {},
      big_cta:        json.big_cta        || {},
      footer:         json.footer         || {},
      // Brand colours + font choices (driven by Theme tab in admin)
      theme:          json.theme          || {},
      // Site-wide config (title, meta description, quote email)
      settings:       json.settings       || {},
      // Per-section show/hide toggles (admin Content tab → Visibility)
      visibility:     json.visibility     || {},
      // Array sections — slot-aligned with their defaults
      pillars:        Array.isArray(json.pillars)        ? json.pillars        : [],
      materials_rows: Array.isArray(json.materials_rows) ? json.materials_rows : [],
      reviews_list:   Array.isArray(json.reviews_list)   ? json.reviews_list   : [],
      // Audit log — most recent first, capped to AUDIT_MAX entries.
      // Each entry: { user, action, target, at, rev }.
      audit:          Array.isArray(json.audit)          ? json.audit          : []
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

// Cap on audit log size — keeps gallery.json small. Older entries roll off.
// Roughly ~100 bytes/entry → 200 entries = 20 KB. Plenty of recent history
// without bloating reads or the public /api/photos response.
const AUDIT_MAX = 200;

export async function writeGallery(gallery) {
  const payload = {
    // Schema version — bumped only when we change the shape of the
    // payload (e.g. add a new override section). Drives migrations.
    schemaVersion: 5,
    // Data revision — incremented on every write. Used by applyMutation
    // for optimistic concurrency control. Caller should pass the next
    // expected rev; defaults to 1 for the very first write.
    rev: typeof gallery.rev === 'number' ? gallery.rev : 1,
    updatedAt: new Date().toISOString(),
    photos:         gallery.photos         || [],
    // Sparse override maps. Empty objects/arrays when untouched.
    services:       gallery.services       || {},
    hero:           gallery.hero           || {},
    contact:        gallery.contact        || {},
    about:          gallery.about          || {},
    services_intro: gallery.services_intro || {},
    contact_intro:  gallery.contact_intro  || {},
    materials:      gallery.materials      || {},
    reviews:        gallery.reviews        || {},
    big_cta:        gallery.big_cta        || {},
    footer:         gallery.footer         || {},
    theme:          gallery.theme          || {},
    settings:       gallery.settings       || {},
    visibility:     gallery.visibility     || {},
    pillars:        Array.isArray(gallery.pillars)        ? gallery.pillars        : [],
    materials_rows: Array.isArray(gallery.materials_rows) ? gallery.materials_rows : [],
    reviews_list:   Array.isArray(gallery.reviews_list)   ? gallery.reviews_list   : [],
    // Audit log — capped to AUDIT_MAX most recent entries
    audit:          Array.isArray(gallery.audit) ? gallery.audit.slice(0, AUDIT_MAX) : []
  };
  await put(GALLERY_KEY, JSON.stringify(payload, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  });
  return payload;
}

// Read-modify-write helper with optimistic concurrency + audit logging.
//
// Usage:
//   const updated = await applyMutation(
//     async (gallery) => ({ ...gallery, photos: nextPhotos }),
//     { user: 'mick', action: 'photo.update', target: photoId }
//   );
//
// `meta` controls the audit log entry recorded on every successful write:
//   user    — canonical username from requireAdmin (or 'system' for seeds)
//   action  — short verb-noun string ('photo.update', 'content.hero', etc.)
//   target  — optional id / path of the thing being changed
// Pass null/omit meta to skip logging (e.g. internal seed writes).
//
// On every attempt: read gallery, run mutator, re-read to confirm the
// rev hasn't moved, then write with rev+1. If a different admin wrote
// in between, retry from scratch. After maxAttempts the caller gets a
// GalleryConflictError which handlers should map to HTTP 409.
export async function applyMutation(mutator, meta = null, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const gallery = await readGallery();
    const startRev = typeof gallery.rev === 'number' ? gallery.rev : 0;

    const updated = await mutator(gallery);
    if (!updated) return gallery; // mutator opted out — return current state

    // Re-read just before write. If rev moved, another admin wrote and
    // we'd clobber their change. Discard, jittered backoff, retry.
    const fresh = await readGallery();
    const freshRev = typeof fresh.rev === 'number' ? fresh.rev : 0;
    if (freshRev !== startRev) {
      const backoff = 50 + Math.random() * 100;
      await new Promise(r => setTimeout(r, backoff));
      continue;
    }

    // Prepend an audit entry so the most recent edit is always at index 0.
    // writeGallery enforces AUDIT_MAX so older entries roll off the tail.
    const nextRev = startRev + 1;
    const existingAudit = Array.isArray(updated.audit) ? updated.audit : [];
    const auditEntry = meta && meta.user ? [{
      user:   meta.user,
      action: meta.action || 'unknown',
      target: meta.target || null,
      at:     new Date().toISOString(),
      rev:    nextRev
    }] : [];

    return await writeGallery({
      ...updated,
      rev: nextRev,
      audit: [...auditEntry, ...existingAudit]
    });
  }
  throw new GalleryConflictError(
    'Too many concurrent edits — please refresh and try again'
  );
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
