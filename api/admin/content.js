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
import { readGallery, applyMutation, GalleryConflictError } from './_lib/store.js';
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
  buildFooter,
  buildTheme,
  buildSettings,
  buildVisibility,
  buildReviewsList
} from '../../src/services-meta.js';

// Domain errors thrown by mutators — handler maps them to HTTP codes.
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export default async function handler(req, res) {
  // requireAdmin returns the canonical username on success — passed
  // to applyMutation so the audit log records who edited what.
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET')   return await getContent(req, res);
    if (req.method === 'PATCH') return await patchContent(req, res, user);

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err instanceof GalleryConflictError) return res.status(409).json({ error: err.message });
    console.error('admin/content error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

// Build the response shape the admin UI consumes — { overrides, merged,
// defaults, audit, rev }. Used by GET, AND by PATCH so the client can
// use the PATCH response directly without a second fetch (avoids any
// chance of browser-cached stale GETs after a save).
function buildContentResponse(gallery) {
  return {
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
      theme:          gallery.theme          || {},
      settings:       gallery.settings       || {},
      visibility:     gallery.visibility     || {},
      pillars:        Array.isArray(gallery.pillars)        ? gallery.pillars        : [],
      materials_rows: Array.isArray(gallery.materials_rows) ? gallery.materials_rows : [],
      reviews_list:   Array.isArray(gallery.reviews_list)   ? gallery.reviews_list   : []
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
      theme:          buildTheme(gallery.theme),
      settings:       buildSettings(gallery.settings),
      visibility:     buildVisibility(gallery.visibility),
      pillars:        buildPillars(gallery.pillars),
      materials_rows: buildMaterialsRows(gallery.materials_rows),
      reviews_list:   buildReviewsList(gallery.reviews_list)
    },
    defaults: { ...FLAT_SECTIONS,
      pillars:        ARRAY_SECTIONS.pillars.defaults,
      materials_rows: ARRAY_SECTIONS.materials_rows.defaults,
      reviews_list:   ARRAY_SECTIONS.reviews_list.defaults
    },
    // Most recent edits first. The admin UI renders this as a "Recent
    // activity" panel so editors can see who's been touching what.
    audit: Array.isArray(gallery.audit) ? gallery.audit.slice(0, 50) : [],
    rev: gallery.rev || 0
  };
}

async function getContent(req, res) {
  const gallery = await readGallery();
  return res.status(200).json(buildContentResponse(gallery));
}

async function patchContent(req, res, user) {
  const body = parseBody(req.body);
  const { section, updates } = body;
  if (!section) throw new HttpError(400, 'section required');
  if (!updates || typeof updates !== 'object') {
    throw new HttpError(400, 'updates must be an object');
  }

  // Validate up-front — fast-fail before any blob IO and before
  // applyMutation kicks off any retry attempts.
  if (section === 'services') {
    for (const slug of Object.keys(updates)) {
      if (!CATEGORY_SLUGS.includes(slug)) {
        throw new HttpError(400, `Unknown service slug: ${slug}`);
      }
    }
  } else if (FLAT_SECTIONS[section]) {
    const allowed = Object.keys(FLAT_SECTIONS[section]);
    for (const field of Object.keys(updates)) {
      if (!allowed.includes(field)) {
        throw new HttpError(400, `Unknown ${section} field: ${field}`);
      }
    }
  } else if (ARRAY_SECTIONS[section]) {
    if (!Array.isArray(updates)) {
      throw new HttpError(400, `${section} updates must be an array`);
    }
    const expected = ARRAY_SECTIONS[section].defaults.length;
    if (updates.length !== 0 && updates.length !== expected) {
      throw new HttpError(400, `${section} expects ${expected} slots, got ${updates.length}`);
    }
  } else {
    throw new HttpError(400, `Unknown section: ${section}`);
  }

  const updated = await applyMutation(async (gallery) => {
    if (section === 'services') {
      // updates: { [slug]: { title?: string, body?: string } }
      const next = { ...(gallery.services || {}) };
      for (const [slug, fields] of Object.entries(updates)) {
        if (!fields || typeof fields !== 'object') continue;
        const current = next[slug] || {};
        const merged = { ...current };
        // Empty string clears (so admin can reset to default by emptying
        // the input). null also clears. Anything else is stored as-is.
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
      return { ...gallery, services: next };
    }

    if (FLAT_SECTIONS[section]) {
      const current = gallery[section] || {};
      const next = { ...current };
      for (const [field, val] of Object.entries(updates)) {
        if (val === null || val === '' || val === undefined) {
          delete next[field];
        } else {
          next[field] = String(val);
        }
      }
      return { ...gallery, [section]: next };
    }

    // ARRAY_SECTIONS — already validated above
    const meta = ARRAY_SECTIONS[section];
    if (updates.length === 0) {
      return { ...gallery, [section]: [] };
    }
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
    return { ...gallery, [section]: normalised };
  }, {
    user,
    // Use 'content.<section>' so the audit log makes the affected
    // section obvious at a glance (e.g. 'content.hero', 'content.services').
    action: `content.${section}`,
    // For services edits, the target is the slug(s) being changed; for
    // flat sections it's the section itself; for arrays it's a count.
    target: section === 'services'
      ? Object.keys(updates).join(',')
      : (Array.isArray(updates) ? `[${updates.length} slots]` : null)
  });
  // Return the same shape as GET so the client can swap its data state
  // straight from this response — no second fetch required after a save.
  return res.status(200).json(buildContentResponse(updated));
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
}
