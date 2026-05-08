// Shared service-category metadata. Single source of truth — imported by:
//   - src/Home.jsx        → renders the service tiles
//   - src/Admin.jsx       → category dropdown in the photo manager
//   - api/admin/photos.js → server-side validation
//   - api/photos.js       → public payload
//
// Each entry has:
//   slug      — machine identifier, stored on each photo's `category` field
//   num       — display number on the tile (01, 02, …)
//   title     — heading on the tile
//   body      — paragraph copy on the tile
//   fallback  — { cover, gallery } used by the homepage when no admin-managed
//               photos are tagged with this category yet. Keeps the site from
//               blanking out before the admin starts categorising photos.
//
// Pure JS — no imports — so it runs unchanged in the React app and the
// Node serverless functions.

export const SERVICE_CATEGORIES = [
  {
    slug: 'shopfront',
    num: '01',
    title: 'Shopfront & Building Signs',
    body: 'ACM panels, fascias and storefront signage. Custom digital print on aluminium composite — engineered for kerb appeal that holds up under sun and weather.',
    fallback: {
      cover: '/portfolio/install-19.webp',
      gallery: [
        { src: '/portfolio/install-19.webp', label: 'Storefront signage' },
        { src: '/portfolio/install-17.webp', label: 'Storefront signage' },
        { src: '/portfolio/install-34.webp', label: 'Storefront signage' },
        { src: '/portfolio/install-36.webp', label: 'Storefront signage' },
        { src: '/portfolio/install-07.webp', label: 'Storefront signage' },
        { src: '/portfolio/install-01.webp', label: 'Panels & promotional' }
      ]
    }
  },
  {
    slug: 'illuminated',
    num: '02',
    title: 'Illuminated Signs',
    body: 'Lightboxes, channel letters and halo-lit cabinets. Internally LED-lit so your sign reads as clearly at midnight as it does at noon.',
    fallback: {
      cover: '/portfolio/install-23.webp',
      gallery: [
        { src: '/portfolio/install-23.webp', label: 'Illuminated bar graphics' },
        { src: '/portfolio/install-34.webp', label: 'Illuminated storefront' }
      ]
    }
  },
  {
    slug: 'vehicle',
    num: '03',
    title: 'Vehicle Wraps & Decals',
    body: 'Door logos, panel decals, full wraps. Vans, trucks, fleet — turn the asset you already own into a mobile billboard.',
    fallback: {
      cover: '/portfolio/install-32.webp',
      gallery: [
        { src: '/portfolio/install-32.webp', label: 'Vehicle wrap' },
        { src: '/portfolio/install-38.webp', label: 'Vehicle wrap' }
      ]
    }
  },
  {
    slug: 'banners',
    num: '04',
    title: 'Banners, Flags & A-Frames',
    body: 'Heavy-duty PVC banners, feather flags and footpath A-frames. Quick-turn marketing for events, sales and seasonal campaigns.',
    fallback: {
      cover: '/portfolio/install-26.webp',
      gallery: [
        { src: '/portfolio/install-26.webp', label: 'Banners' },
        { src: '/portfolio/install-27.webp', label: 'Hanging fabric banners' },
        { src: '/portfolio/install-01.webp', label: 'Panels & promotional' }
      ]
    }
  },
  {
    slug: 'graphics',
    num: '05',
    title: 'Windows & Wall Graphics',
    body: 'Vinyl window graphics, frosted privacy film, large-format wall murals. Brand presence and privacy in equal measure.',
    fallback: {
      cover: '/portfolio/install-08.webp',
      gallery: [
        { src: '/portfolio/install-08.webp', label: 'Wall mural' },
        { src: '/portfolio/install-04.webp', label: 'Wall graphics' },
        { src: '/portfolio/install-13.webp', label: 'Wall graphics' }
      ]
    }
  },
  {
    slug: 'pylons',
    num: '06',
    title: 'Pylons & Wayfinding',
    body: 'Free-standing roadside pylons and compact directional signs. Premium road-facing signage for centres, car parks and campus navigation.',
    fallback: {
      cover: '/portfolio/hero.webp',
      gallery: [
        { src: '/portfolio/hero.webp',       label: 'Inhouse production' },
        { src: '/portfolio/install-19.webp', label: 'Storefront signage' }
      ]
    }
  }
];

// Helper: list of valid category slugs. Used by the admin PATCH endpoint
// to reject anything else (typo, attempted injection, etc.).
export const CATEGORY_SLUGS = SERVICE_CATEGORIES.map(c => c.slug);

// ─────────────────────────────────────────────────────────────────
// Page content defaults — admin can override any of these via
// /api/admin/content; the homepage merges defaults + overrides at
// render time so unedited fields keep showing the original copy.

export const HERO_DEFAULTS = {
  // The thin amber pill above the headline
  eyebrow:       'Sydney · Arndell Park · Established 20 years · Design · Print · Install',
  // Headline is split into three parts so the middle word can keep its
  // glitch animation while the rest stays plain
  headlinePre:   'STAND OUT WITH',
  headlineGlitch:'STRIKING',
  headlinePost:  'SIGNAGE',
  // The paragraph under the headline
  lede:          'Custom signs, banners, decals, lightboxes, vehicle wraps, custom window frosting, and more. Designed, manufactured and installed Australia wide.\nMade inhouse from Arndell Park, Sydney',
  ctaPrimary:    'See our work →',
  ctaSecondary:  'Get in touch'
};

export const CONTACT_DEFAULTS = {
  phone:   '0422 626 286',
  email:   'info@strikeprint.com.au',
  // Multi-line — rendered with white-space: pre-line on the homepage so
  // a literal \n becomes a line break (e.g. street + suburb on two lines)
  address: '26/70 Holbeche Rd\nArndell Park NSW 2148',
  hours:   'Mon–Fri · 8am–4pm',
  // Map embed query — usually mirrors `address` but kept separate so admin
  // can adjust the pin without changing the displayed text
  mapsQuery: '26/70 Holbeche Rd, Arndell Park NSW 2148'
};

// Merges a sparse override object on top of the defaults. Empty strings
// don't clobber — admins clearing a field "to default" should leave it
// blank in the editor, server stores it as null/undefined which falls
// through to the default below.
function shallowMerge(defaults, overrides) {
  if (!overrides) return defaults;
  const out = { ...defaults };
  for (const k of Object.keys(overrides)) {
    const v = overrides[k];
    if (v !== null && v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

export function buildHero(overrides)    { return shallowMerge(HERO_DEFAULTS, overrides); }
export function buildContact(overrides) { return shallowMerge(CONTACT_DEFAULTS, overrides); }

// Helper: takes the photo list from /api/photos and the SERVICE_CATEGORIES
// definitions, returns the SERVICES array the homepage needs:
//   [{ num, title, body, cover, gallery: [{src, label}] }, …]
//
// Logic per category:
//   - Filter photos where category === slug
//   - If none, use the hardcoded fallback (so the site stays usable before
//     admin starts tagging things)
//   - Cover = the photo flagged `featured`, or the first photo if none
//     flagged, or the fallback cover
//   - Gallery = all category-tagged photos (admin-curated order), or the
//     fallback gallery
// `serviceOverrides` is a sparse map of { slug: { title?, body? } } —
// admin-edited values from gallery.json. Anything not overridden falls
// back to the SERVICE_CATEGORIES default for that slug.
export function buildServices(photos = [], serviceOverrides = {}) {
  return SERVICE_CATEGORIES.map(cat => {
    const override = serviceOverrides[cat.slug] || {};
    const title = (override.title && override.title.trim()) || cat.title;
    const body  = (override.body  && override.body.trim())  || cat.body;

    const tagged = photos
      .filter(p => p.category === cat.slug)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (tagged.length === 0) {
      return {
        num: cat.num,
        slug: cat.slug,
        title, body,
        cover: cat.fallback.cover,
        gallery: cat.fallback.gallery
      };
    }

    const featured = tagged.find(p => p.featured) || tagged[0];
    return {
      num: cat.num,
      slug: cat.slug,
      title, body,
      cover: featured.src || featured.url,
      gallery: tagged.map(p => ({ src: p.src || p.url, label: p.label }))
    };
  });
}
