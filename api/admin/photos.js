// Admin photo management API.
//   GET    → list all photos (auth required)
//   POST   → add a new photo entry { url, label } (after client uploaded to Blob)
//   PATCH  → edit { id, label?, order? } (re-order also via { ids: [...] })
//   DELETE → remove { id } (also deletes the Blob if it's an uploaded one)
import { del } from '@vercel/blob';
import { requireAdmin } from './_lib/auth.js';
import { readGallery, writeGallery, makeId } from './_lib/store.js';
import { CATEGORY_SLUGS } from '../../src/services-meta.js';

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
  if (!url || !label) return res.status(400).json({ error: 'url + label required' });

  // Validate category if supplied — silently drop unknown values rather
  // than 400 so a typo in admin doesn't reject the upload entirely.
  const cat = (category && CATEGORY_SLUGS.includes(category)) ? category : null;

  const gallery = await readGallery();
  const newPhoto = {
    id: makeId(),
    url: String(url),
    label: String(label),
    category: cat,
    featured: false,
    order: gallery.photos.length,
    seed: false,
    createdAt: new Date().toISOString()
  };
  // Spread the gallery so existing services/hero/contact overrides
  // pass through — writeGallery rebuilds the whole payload.
  const updated = await writeGallery({ ...gallery, photos: [...gallery.photos, newPhoto] });
  return res.status(201).json({ photo: newPhoto, gallery: updated });
}

async function patchPhotos(req, res) {
  const body = parseBody(req.body);

  // Bulk reorder via { ids: [...] }
  if (Array.isArray(body.ids)) {
    const gallery = await readGallery();
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
    const updated = await writeGallery({ ...gallery, photos: [...reordered, ...tail] });
    return res.status(200).json(updated);
  }

  // Single edit via { id, label?, category?, featured? }
  const { id, label, category, featured } = body;
  if (!id) return res.status(400).json({ error: 'id required' });

  const gallery = await readGallery();
  const target = gallery.photos.find(p => p.id === id);
  if (!target) return res.status(404).json({ error: 'Photo not found' });

  // Validate category — null/empty clears it; invalid slug is rejected.
  let nextCategory = target.category ?? null;
  if (category !== undefined) {
    if (category === null || category === '') {
      nextCategory = null;
    } else if (CATEGORY_SLUGS.includes(category)) {
      nextCategory = category;
    } else {
      return res.status(400).json({ error: `Unknown category: ${category}` });
    }
  }

  // Featured toggle. If we're marking this photo as featured, atomically
  // un-feature every other photo in the same category — only one cover
  // per service. The category is whichever value we're settling on for
  // *this* photo (could be the existing one, could be the new one).
  const willBeFeatured = featured === true;
  const effectiveCategory = nextCategory; // already resolved above

  const next = gallery.photos.map(p => {
    if (p.id === id) {
      return {
        ...p,
        ...(label !== undefined    ? { label: String(label) } : {}),
        ...(category !== undefined ? { category: nextCategory } : {}),
        ...(featured !== undefined ? { featured: willBeFeatured } : {})
      };
    }
    // Auto-clear featured on siblings in the same category when this one
    // becomes the cover. No-op if we're un-featuring or not in that category.
    if (willBeFeatured && p.featured && p.category === effectiveCategory) {
      return { ...p, featured: false };
    }
    return p;
  });

  const updated = await writeGallery({ ...gallery, photos: next });
  return res.status(200).json(updated);
}

async function deletePhoto(req, res) {
  const body = parseBody(req.body);
  const { id } = body;
  if (!id) return res.status(400).json({ error: 'id required' });

  const gallery = await readGallery();
  const target = gallery.photos.find(p => p.id === id);
  if (!target) return res.status(404).json({ error: 'Photo not found' });

  // If this is an uploaded photo (full URL pointing at our Blob), delete the
  // binary too. Seed photos (relative paths under /portfolio/) are static
  // files and stay where they are.
  if (target.url && target.url.startsWith('http') && target.url.includes('public.blob.vercel-storage')) {
    try { await del(target.url); } catch (e) { console.warn('blob delete failed', e); }
  }

  const next = gallery.photos
    .filter(p => p.id !== id)
    .map((p, i) => ({ ...p, order: i }));
  const updated = await writeGallery({ ...gallery, photos: next });
  return res.status(200).json(updated);
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
}
