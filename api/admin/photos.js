// Admin photo management API.
//   GET    → list all photos (auth required)
//   POST   → add a new photo entry { url, label } (after client uploaded to Blob)
//   PATCH  → edit { id, label?, order? } (re-order also via { ids: [...] })
//   DELETE → remove { id } (also deletes the Blob if it's an uploaded one)
import { del } from '@vercel/blob';
import { requireAdmin } from './_lib/auth.js';
import { readGallery, writeGallery, makeId } from './_lib/store.js';

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
  const { url, label } = body;
  if (!url || !label) return res.status(400).json({ error: 'url + label required' });

  const gallery = await readGallery();
  const newPhoto = {
    id: makeId(),
    url: String(url),
    label: String(label),
    order: gallery.photos.length,
    seed: false,
    createdAt: new Date().toISOString()
  };
  const updated = await writeGallery({ photos: [...gallery.photos, newPhoto] });
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
    const updated = await writeGallery({ photos: [...reordered, ...tail] });
    return res.status(200).json(updated);
  }

  // Single edit via { id, label }
  const { id, label } = body;
  if (!id) return res.status(400).json({ error: 'id required' });

  const gallery = await readGallery();
  const next = gallery.photos.map(p => p.id === id
    ? { ...p, ...(label !== undefined ? { label: String(label) } : {}) }
    : p
  );
  const updated = await writeGallery({ photos: next });
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
  const updated = await writeGallery({ photos: next });
  return res.status(200).json(updated);
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
}
