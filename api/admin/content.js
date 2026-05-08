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
  FLAT_SECTIONS,
  ARRAY_SECTIONS,
  buildHero,
  buildContact,
  buildAbout,
  buildPillars,
  buildServicesIntro,
  buildContactIntro,
  buildMaterials,
  buildMaterialsRows,
  buildReviews,
  buildBigCta,
  buildFooter
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
      pillars:        Array.isArray(gallery.pillars)        ? gallery.pillars        : [],
      materials_rows: Array.isArray(gallery.materials_rows) ? gallery.materials_rows : []
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
      hero:           buildHero(gallery.hero),
      contact:        buildContact(gallery.contact),
      about:          buildAbout(gallery.about),
      services_intro: buildServicesIntro(gallery.services_intro),
      contact_intro:  buildContactIntro(gallery.contact_intro),
      materials:      buildMaterials(gallery.materials),
      reviews:        buildReviews(gallery.reviews),
      big_cta:        buildBigCta(gallery.big_cta),
      footer:         buildFooter(gallery.footer),
      pillars:        buildPillars(gallery.pillars),
      materials_rows: buildMaterialsRows(gallery.materials_rows)
    },
    defaults: { ...FLAT_SECTIONS,
      pillars:        ARRAY_SECTIONS.pillars.defaults,
      materials_rows: ARRAY_SECTIONS.materials_rows.defaults
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

  // Flat sections (hero, contact, about, services_intro, contact_intro,
  // materials, reviews, big_cta, footer). Updates is { [field]: string|null };
  // empty/null clears the override → falls through to default on read.
  if (FLAT_SECTIONS[section]) {
    const allowed = Object.keys(FLAT_SECTIONS[section]);
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

  // Array sections (pillars, materials_rows). Body shape:
  //   { section: 'pillars', updates: [{ key, body }, …] }   (full replace)
  // Slot count must match the defaults exactly. To "reset" a slot, send
  // an empty object {} — the homepage will fall back to the default for
  // that index. To reset the whole section, send updates: [].
  if (ARRAY_SECTIONS[section]) {
    const meta = ARRAY_SECTIONS[section];
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: `${section} updates must be an array` });
    }
    // Empty array = clear all overrides (homepage uses defaults)
    if (updates.length === 0) {
      const updated = await writeGallery({ ...gallery, [section]: [] });
      return res.status(200).json(updated);
    }
    // Otherwise must exactly match the slot count
    if (updates.length !== meta.defaults.length) {
      return res.status(400).json({
        error: `${section} expects ${meta.defaults.length} slots, got ${updates.length}`
      });
    }
    // Validate + normalise each slot. Allowed keys are the itemKeys for
    // that section (e.g. ['key', 'body'] for pillars). Empty fields stay
    // empty in the stored value — buildPillars/buildMaterialsRows will
    // fall back to the default per-field on read.
    const normalised = updates.map(item => {
      if (!item || typeof item !== 'object') return {};
      const out = {};
      for (const k of meta.itemKeys) {
        if (item[k] !== undefined && item[k] !== null) {
          const s = String(item[k]).trim();
          if (s !== '') out[k] = s;
        }
      }
      return out;
    });
    const updated = await writeGallery({ ...gallery, [section]: normalised });
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
