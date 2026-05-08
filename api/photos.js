// Public homepage data — no auth, single fetch returns everything the
// homepage needs: photos (with category/featured), service title+body
// overrides, hero copy, contact info. All defaults are merged in on the
// server so the client just consumes ready-to-render values.
//
// Falls back gracefully: if Blob is unreachable or gallery.json doesn't
// exist yet, returns just photos: [] and the homepage uses its compiled-in
// fallbacks (so the site never blanks out).
import { readGallery } from './admin/_lib/store.js';
import {
  buildHero, buildContact, buildAbout, buildServicesIntro, buildContactIntro,
  buildMaterials, buildMaterialsRows, buildPillars, buildReviews, buildBigCta,
  buildFooter, SERVICE_CATEGORIES
} from '../src/services-meta.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gallery = await readGallery();
    const photos = [...(gallery.photos || [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(p => ({
        id: p.id,
        src: p.url,
        label: p.label,
        // Service-category metadata: empty/null when uncategorised.
        // Homepage uses these to group photos into per-service galleries
        // and pick a featured photo as the tile cover.
        category: p.category || null,
        featured: !!p.featured,
        order: p.order ?? 0
      }));

    // Service title/body overrides — public-friendly: only emit slugs that
    // actually have edits, so the homepage falls back to defaults for the rest.
    const services = {};
    for (const cat of SERVICE_CATEGORIES) {
      const o = (gallery.services || {})[cat.slug];
      if (o && (o.title || o.body)) {
        services[cat.slug] = {
          ...(o.title ? { title: o.title } : {}),
          ...(o.body  ? { body: o.body  } : {})
        };
      }
    }

    // Cache at the edge for 10s — admin edits become visible within
    // 10s without forcing every public hit to read Blob fresh.
    // (Was 60s; tightened so changes from /admin show up promptly on
    // the live homepage. SWR keeps stale responses warm under load.)
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10, stale-while-revalidate=60');
    return res.status(200).json({
      photos,
      services,
      // All merged with defaults server-side so the homepage just consumes
      // ready-to-render values (one fetch, no per-section guarding needed).
      hero:           buildHero(gallery.hero),
      contact:        buildContact(gallery.contact),
      about:          buildAbout(gallery.about),
      services_intro: buildServicesIntro(gallery.services_intro),
      contact_intro:  buildContactIntro(gallery.contact_intro),
      materials:      buildMaterials(gallery.materials),
      materials_rows: buildMaterialsRows(gallery.materials_rows),
      pillars:        buildPillars(gallery.pillars),
      reviews:        buildReviews(gallery.reviews),
      big_cta:        buildBigCta(gallery.big_cta),
      footer:         buildFooter(gallery.footer)
    });
  } catch (err) {
    console.error('public/photos error', err);
    return res.status(200).json({ photos: [] });
  }
}
