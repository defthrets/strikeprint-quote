// Admin content management API.
//   GET   → returns the merged content state ({ services, hero, contact })
//           — defaults overlaid with admin overrides
//   PATCH → updates one section. Body shape:
//             { section: 'services'|'hero'|'contact', updates: {…} }
//           For services, updates is keyed by category slug:
//             { section: 'services', updates: { shopfront: { title, body }, … } }
//
// Stored in the same gallery.json as photos (under top-level `services`,
// `hero`, `contact` keys) so admin changes are atomic with photo edits
// and the public API can hand the homepage everything in one fetch.

import { requireAdmin } from './_lib/auth.js';
import { readGallery, writeGallery } from './_lib/store.js';
import {
  CATEGORY_SLUGS,
  HERO_DEFAULTS,
  CONTACT_DEFAULTS,
  SERVICE_CATEGORIES,
  buildHero,
  buildContact
} from '../../src/services-meta.js';

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;

  try {
    if (req.method === 'GET')   return await getContent(req, res);
    if (req.method === 'PATCH') return await patchContent(req, res);

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/content error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

async function getContent(req, res) {
  const gallery = await readGallery();
  // Hand back the raw overrides AND the merged-with-defaults values,
  // plus the defaults themselves so the admin UI can show "this is the
  // factory default" hints / reset buttons.
  return res.status(200).json({
    overrides: {
      services: gallery.services || {},
      hero:     gallery.hero     || {},
      contact:  gallery.contact  || {}
    },
    merged: {
      services: SERVICE_CATEGORIES.map(cat => {
        const o = (gallery.services || {})[cat.slug] || {};
        return {
          slug: cat.slug,
          num:  cat.num,
          title: o.title || cat.title,
          body:  o.body  || cat.body,
          defaults: { title: cat.title, body: cat.body }
        };
      }),
      hero:    buildHero(gallery.hero),
      contact: buildContact(gallery.contact)
    },
    defaults: {
      hero:    HERO_DEFAULTS,
      contact: CONTACT_DEFAULTS
    }
  });
}

async function patchContent(req, res) {
  const body = parseBody(req.body);
  const { section, updates } = body;
  if (!section) return res.status(400).json({ error: 'section required' });
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'updates must be an object' });
  }

  const gallery = await readGallery();

  if (section === 'services') {
    // updates: { [slug]: { title?: string, body?: string } }
    const next = { ...(gallery.services || {}) };
    for (const [slug, fields] of Object.entries(updates)) {
      if (!CATEGORY_SLUGS.includes(slug)) {
        return res.status(400).json({ error: `Unknown service slug: ${slug}` });
      }
      if (!fields || typeof fields !== 'object') continue;
      const current = next[slug] || {};
      const merged = { ...current };
      // Empty string clears (so admin can reset to default by emptying the
      // input). null also clears. Anything else is stored as-is.
      if (fields.title !== undefined) {
        const v = String(fields.title);
        if (v === '' || fields.title === null) delete merged.title;
        else merged.title = v;
      }
      if (fields.body !== undefined) {
        const v = String(fields.body);
        if (v === '' || fields.body === null) delete merged.body;
        else merged.body = v;
      }
      // If the override object is now empty, drop the key entirely
      if (Object.keys(merged).length === 0) delete next[slug];
      else next[slug] = merged;
    }
    const updated = await writeGallery({ ...gallery, services: next });
    return res.status(200).json(updated);
  }

  if (section === 'hero' || section === 'contact') {
    // updates: { [field]: string | null }
    const allowed = section === 'hero'
      ? Object.keys(HERO_DEFAULTS)
      : Object.keys(CONTACT_DEFAULTS);
    const current = gallery[section] || {};
    const next = { ...current };
    for (const [field, val] of Object.entries(updates)) {
      if (!allowed.includes(field)) {
        return res.status(400).json({ error: `Unknown ${section} field: ${field}` });
      }
      if (val === null || val === '' || val === undefined) {
        delete next[field];
      } else {
        next[field] = String(val);
      }
    }
    const updated = await writeGallery({ ...gallery, [section]: next });
    return res.status(200).json(updated);
  }

  return res.status(400).json({ error: `Unknown section: ${section}` });
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
}
