// Admin photo management API.
//   GET    → list all photos (auth required)
//   POST   → add a new photo entry { url, label } (after client uploaded to Blob)
//   PATCH  → edit { id, label?, order? } (re-order also via { ids: [...] })
//   DELETE → remove { id } (also deletes the Blob if it's an uploaded one)
import { del } from '@vercel/blob';
import { requireAdmin } from './_lib/auth.js';
import { readGallery, writeGallery, applyMutation, GalleryConflictError, makeId } from './_lib/store.js';
import { CATEGORY_SLUGS } from '../../src/services-meta.js';

// Domain errors thrown by mutators — handler maps them to HTTP codes.
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;

  try {
    if (req.method === 'GET')    return await listPhotos(req, res);
    if (req.method === 'POST')   return await addPhoto(req, res);
    if (req.method === 'PATCH')  return await patchPhotos(req, res);
    if (req.method === 'DELETE') return await deletePhoto(req, res);

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err instanceof GalleryConflictError) return res.status(409).json({ error: err.message });
    console.error('admin/photos error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function listPhotos(req, res) {
  const gallery = await readGallery();
  return res.status(200).json(gallery);
}

async function addPhoto(req, res) {
  const body = parseBody(req.body);
  const { url, label, category } = body;
  if (!url || !label) throw new HttpError(400, 'url + label required');

  // Validate category if supplied — silently drop unknown values rather
  // than 400 so a typo in admin doesn't reject the upload entirely.
  const cat = (category && CATEGORY_SLUGS.includes(category)) ? category : null;
  let createdPhoto = null;

  const updated = await applyMutation(async (gallery) => {
    // Build the new photo on each retry attempt — order depends on the
    // CURRENT gallery length (so two parallel uploads end up at distinct
    // tail positions instead of stomping each other's order).
    createdPhoto = {
      id: makeId(),
      url: String(url),
      label: String(label),
      category: cat,
      featured: false,
      order: gallery.photos.length,
      seed: false,
      createdAt: new Date().toISOString()
    };
    return { ...gallery, photos: [...gallery.photos, createdPhoto] };
  });
  return res.status(201).json({ photo: createdPhoto, gallery: updated });
}

async function patchPhotos(req, res) {
  const body = parseBody(req.body);

  // Bulk reorder via { ids: [...] }
  if (Array.isArray(body.ids)) {
    const updated = await applyMutation(async (gallery) => {
      const byId = new Map(gallery.photos.map(p => [p.id, p]));
      const reordered = body.ids
        .map(id => byId.get(id))
        .filter(Boolean)
        .map((p, i) => ({ ...p, order: i }));
      // Append any photos that weren't included in the ids list (defensive)
      const includedIds = new Set(body.ids);
      const tail = gallery.photos
        .filter(p => !includedIds.has(p.id))
        .map((p, i) => ({ ...p, order: reordered.length + i }));
      return { ...gallery, photos: [...reordered, ...tail] };
    });
    return res.status(200).json(updated);
  }

  // Single edit via { id, label?, category?, featured? }
  const { id, label, category, featured } = body;
  if (!id) throw new HttpError(400, 'id required');

  // Validate category up-front — fast-fail before any blob IO.
  if (category !== undefined && category !== null && category !== ''
      && !CATEGORY_SLUGS.includes(category)) {
    throw new HttpError(400, `Unknown category: ${category}`);
  }

  const updated = await applyMutation(async (gallery) => {
    const target = gallery.photos.find(p => p.id === id);
    if (!target) throw new HttpError(404, 'Photo not found');

    // Resolve the next category from the body (already validated above).
    let nextCategory = target.category ?? null;
    if (category !== undefined) {
      nextCategory = (category === null || category === '') ? null : category;
    }

    const willBeFeatured = featured === true;
    const effectiveCategory = nextCategory;

    // When a photo moves to a different category, clear its `featured`
    // flag automatically. Otherwise it'd land in the new bucket still
    // marked as cover — possibly a duplicate of whatever's already
    // featured there. Admin can re-mark it as cover in the new group.
    const categoryChanged = category !== undefined && nextCategory !== (target.category ?? null);

    const next = gallery.photos.map(p => {
      if (p.id === id) {
        const updated = { ...p };
        if (label !== undefined)    updated.label    = String(label);
        if (category !== undefined) updated.category = nextCategory;
        if (featured !== undefined) updated.featured = willBeFeatured;
        // Auto-clear featured on category change unless the same request
        // is also explicitly setting featured (admin can move + cover in
        // one shot if they really want to).
        if (categoryChanged && featured === undefined) updated.featured = false;
        return updated;
      }
      // Auto-clear featured on siblings in the same category when this
      // one becomes the cover. No-op if we're un-featuring or not in
      // that category.
      if (willBeFeatured && p.featured && p.category === effectiveCategory) {
        return { ...p, featured: false };
      }
      return p;
    });
    return { ...gallery, photos: next };
  });
  return res.status(200).json(updated);
}

async function deletePhoto(req, res) {
  const body = parseBody(req.body);
  const { id } = body;
  if (!id) throw new HttpError(400, 'id required');

  // We need to delete the underlying blob if this is an uploaded photo.
  // Capture the URL before mutating so we can clean up after the write
  // succeeds (delete-after-write avoids a half-committed state where the
  // blob is gone but the gallery still references it).
  let blobUrlToDelete = null;

  const updated = await applyMutation(async (gallery) => {
    const target = gallery.photos.find(p => p.id === id);
    if (!target) throw new HttpError(404, 'Photo not found');

    // Set on each attempt — applyMutation may retry, and we want the
    // freshest URL in case the photo was re-uploaded mid-flight.
    blobUrlToDelete = (target.url && target.url.startsWith('http')
      && target.url.includes('public.blob.vercel-storage'))
      ? target.url : null;

    const next = gallery.photos
      .filter(p => p.id !== id)
      .map((p, i) => ({ ...p, order: i }));
    return { ...gallery, photos: next };
  });

  // Clean up the blob binary after the metadata write committed. If this
  // fails we leave a dangling blob (cheap, ignorable) rather than rolling
  // back the gallery edit — admin already saw the photo disappear.
  if (blobUrlToDelete) {
    try { await del(blobUrlToDelete); } catch (e) { console.warn('blob delete failed', e); }
  }

  return res.status(200).json(updated);
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
}
