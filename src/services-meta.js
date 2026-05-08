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

// ─── About section (#about) ─────────────────────────────────────
// Title is split into 3 parts so the gradient highlight can stay on
// the middle word ("Custom signage, [built to last].")
export const ABOUT_DEFAULTS = {
  eyebrow:   'About Strike Print',
  titlePre:  'Custom signage,',
  titleGrad: 'built to last',
  titlePost: '.',
  intro1:    'At Strike Print we design, manufacture and install custom signs that get businesses noticed and keep them looking sharp for years.',
  intro2:    'From a single shopfront fascia to a fleet vehicle rollout, every job runs the same way: clean specs, premium materials, careful install. We work with local trades, retail, hospitality, fitness, healthcare and corporate clients across Western Sydney and beyond.'
};
export function buildAbout(overrides) { return shallowMerge(ABOUT_DEFAULTS, overrides); }

// ─── Pillars (the 4 cards under About) ─────────────────────────
// Fixed at 4 entries — admin can edit each but not add/remove
// (the homepage layout is a 4-column grid).
export const PILLARS_DEFAULTS = [
  { key: 'Materials', body: 'ACM, acrylic, vinyl, fabric, LEDs — only what we trust on a real install.' },
  { key: 'Install',   body: 'Licensed and insured. Heritage zones, council permits, lift hire — handled.' },
  { key: 'Design',    body: 'Bring your own artwork or let us lay it out — bring it from idea to wall.' },
  { key: 'Aftercare', body: 'Sign needs work? We come back. We stand behind every install.' }
];
// Always returns exactly 4 entries. Admin override is an array of objects;
// each slot uses overrides[i].key/body when present, otherwise falls back
// to the default for that index. Keeps the homepage robust against partial
// or empty overrides.
export function buildPillars(overrides) {
  const arr = Array.isArray(overrides) ? overrides : [];
  return PILLARS_DEFAULTS.map((def, i) => {
    const o = arr[i] || {};
    return {
      key:  (o.key  && String(o.key).trim())  || def.key,
      body: (o.body && String(o.body).trim()) || def.body
    };
  });
}

// ─── Services section header (above the 6 service tiles) ──────
// Note: this is the section's framing copy — separate from each
// service tile's own title/body (those are stored under `services`).
export const SERVICES_INTRO_DEFAULTS = {
  eyebrow: 'What we make',
  title:   'What we do',
  intro:   "We use premium materials on every job — Avery, 3M and Arlon cast vinyl films, ACM, acrylic and aluminium, finished with UV-stable inks rated for years of Australian sun. Every sign we hang is built to last. Click any service to see the full gallery."
};
export function buildServicesIntro(overrides) { return shallowMerge(SERVICES_INTRO_DEFAULTS, overrides); }

// ─── Contact section header ─────────────────────────────────────
// Separate from CONTACT_DEFAULTS, which holds the actual contact
// info (phone/email/etc.).
export const CONTACT_INTRO_DEFAULTS = {
  eyebrow: 'Get in touch',
  title:   'Drop in. Call. Email.',
  intro:   "Quote tool not your speed? Call, email, or drop in to the Arndell Park workshop — we're happy to chat through anything."
};
export function buildContactIntro(overrides) { return shallowMerge(CONTACT_INTRO_DEFAULTS, overrides); }

// ─── Materials / Quality strip ─────────────────────────────────
// The "Premium materials. No shortcuts." block, plus the Trusted
// materials box. The 6 brand rows live under `materials_rows`.
export const MATERIALS_DEFAULTS = {
  titlePre:  'Premium materials.',
  titleGrad: 'No shortcuts.',
  titlePost: '',
  body1:     "We've been at it for two decades with work that lasts to show for it. That means only premium products like Avery, 3M and Arlon vinyls, ACM panels, solid acrylic, industrial-grade aluminium and UV-stable inks rated for years of Australian sun. We know the right product suited to your needs.",
  body2:     '',
  ctaLabel:  'Talk to us →',
  boxTitle:  'Trusted materials'
};
export function buildMaterials(overrides) { return shallowMerge(MATERIALS_DEFAULTS, overrides); }

// ─── Materials rows (the 6 brand entries) ──────────────────────
// Note: ARLON's detail is intentionally lowercase ("Print media") to match
// the rest of the row captions — older versions had it as "PRINT MEDIA"
// which broke the visual rhythm. Same story for "UV-stable inks" detail.
//
// `logo` is an optional URL — when set, the homepage renders the logo
// image in place of the bold name text. Source the actual brand logos
// from each company's official brand-assets / press-kit page (e.g.
// avery.com / 3m.com / arlon-graphics.com), drop the SVG into
// /public/materials/, and reference it as e.g. '/materials/avery.svg'.
// You can also upload via the Photos tab and paste the resulting blob
// URL. Empty = falls back to the bold name text.
export const MATERIALS_ROWS_DEFAULTS = [
  { name: 'AVERY',          detail: 'Cast vinyl',                logo: '' },
  { name: '3M',             detail: 'Wraps · Decals',            logo: '' },
  { name: 'ARLON',          detail: 'Print media',               logo: '' },
  { name: 'ACM + Acrylic',  detail: 'Panels · Letters',          logo: '' },
  { name: 'LED',            detail: 'Halo · Channel',            logo: '' },
  { name: 'UV-stable inks', detail: 'Australian outdoor rated',  logo: '' }
];
// Returns exactly 6 entries; per-slot fallback to default like buildPillars.
// Logo is passed through as-is when set (no default fallback — empty
// string means "render the name text instead of an image").
export function buildMaterialsRows(overrides) {
  const arr = Array.isArray(overrides) ? overrides : [];
  return MATERIALS_ROWS_DEFAULTS.map((def, i) => {
    const o = arr[i] || {};
    return {
      name:   (o.name   && String(o.name).trim())   || def.name,
      detail: (o.detail && String(o.detail).trim()) || def.detail,
      logo:   (o.logo   && String(o.logo).trim())   || def.logo || ''
    };
  });
}

// ─── Reviews CTA strip ─────────────────────────────────────────
export const REVIEWS_DEFAULTS = {
  title:    'Liked the work?',
  sub:      'Leave us a Google review — it helps a small workshop go a long way.',
  ctaLabel: 'See us on Google →',
  ctaUrl:   'https://www.google.com/search?q=strike+print+arndell+park'
};
export function buildReviews(overrides) { return shallowMerge(REVIEWS_DEFAULTS, overrides); }

// ─── Big CTA card (bottom of contact section) ─────────────────
// ctaLabel deliberately doesn't include the phone — homepage appends
// CONTACT.phone so the call button always matches the contact info.
export const BIG_CTA_DEFAULTS = {
  eyebrow:  'Skip the back-and-forth',
  title:    'Get a real quote. Right now.',
  body:     'Give Paul a call today and discuss your next sign.',
  ctaLabel: '→ Call'
};
export function buildBigCta(overrides) { return shallowMerge(BIG_CTA_DEFAULTS, overrides); }

// ─── Footer ────────────────────────────────────────────────────
// tagline shows on the left side; year auto-appended by Home.jsx.
export const FOOTER_DEFAULTS = {
  tagline: 'Strike Print · Arndell Park NSW'
};
export function buildFooter(overrides) { return shallowMerge(FOOTER_DEFAULTS, overrides); }

// ─── Theme (colours + fonts) ──────────────────────────────────
// Three brand-accent colours drive the amber→orange→yellow gradient
// used everywhere on the homepage (CTA buttons, gradient text, etc.).
// Display + body fonts are picked from a curated list of Google Fonts
// — see DISPLAY_FONT_OPTIONS / BODY_FONT_OPTIONS below. The homepage
// uses CSS custom properties (--amber, --font-display, …) so a save
// here applies instantly without a rebuild.
export const THEME_DEFAULTS = {
  amber:       '#f59a10',  // primary brand accent
  orange:      '#f0601f',  // gradient mid-tone
  yellow:      '#fad905',  // gradient highlight
  displayFont: 'Big Shoulders Display',
  bodyFont:    'Inter Tight'
};
// Curated dropdowns for the admin ThemeTab. Adding a new option here
// also requires the homepage's font loader to know about it (it'll
// build the Google Fonts URL based on whichever pair is active).
export const DISPLAY_FONT_OPTIONS = [
  'Big Shoulders Display',  // default — chunky athletic italic
  'Bebas Neue',             // tall narrow caps
  'Anton',                  // condensed sans
  'Archivo Black'           // heavier extra-bold geometric
];
export const BODY_FONT_OPTIONS = [
  'Inter Tight',            // default — slightly condensed
  'Inter',                  // flagship neutral sans
  'DM Sans',                // softer rounded
  'Manrope'                 // semi-rounded modern
];
export function buildTheme(overrides) { return shallowMerge(THEME_DEFAULTS, overrides); }

// ─── Settings ─────────────────────────────────────────────────
// Site-wide configuration the admin should be able to tweak without
// touching code. Site title / meta description are applied to the
// document at runtime (via Home.jsx). Quote email recipient is read
// by /api/send-quote — overrides QUOTE_RECIPIENT env var so admin
// can re-route quote enquiries without a deploy.
export const SETTINGS_DEFAULTS = {
  siteTitle:       'Strike Print · Sydney Signage Installers',
  metaDescription: 'Custom signs, banners, decals, lightboxes, vehicle wraps and more. Designed, manufactured and installed Australia-wide from Arndell Park, Sydney.',
  quoteEmail:      'mick@strikeprint.com.au'
};
export function buildSettings(overrides) { return shallowMerge(SETTINGS_DEFAULTS, overrides); }

// ─── Section visibility ───────────────────────────────────────
// Per-section show/hide toggles. Default `true` so the homepage looks
// the same on a fresh deploy; admin flips to `false` from the Content
// tab to remove a section from the public site without losing its data
// (re-enable any time and the saved content reappears).
//
// PATCH /api/admin/content stores values via String() — booleans come
// back as 'true' / 'false' strings, so buildVisibility coerces both
// shapes back to real booleans.
export const VISIBILITY_DEFAULTS = {
  hero:     true,
  about:    true,   // section 01 + the 4 pillars
  services: true,   // section 02 + the 6 service tiles
  materials: true,  // the "Premium materials" two-column strip
  contact:  true,   // section 03 + map + contact cards
  reviews:  true,   // the "Liked the work?" strip inside contact
  big_cta:  true,   // the orange-edged "Get a real quote" card
  footer:   true
};
export function buildVisibility(overrides) {
  const out = { ...VISIBILITY_DEFAULTS };
  if (!overrides) return out;
  for (const [k, v] of Object.entries(overrides)) {
    if (v === false || v === 'false' || v === 0 || v === '0') out[k] = false;
    else if (v === true || v === 'true' || v === 1 || v === '1') out[k] = true;
    // anything else (empty, null, garbage) → leave as default
  }
  return out;
}

// Convenience — list of every flat section name + its defaults map. Used
// by the admin API for validation (and the public API for one-shot merge).
export const FLAT_SECTIONS = {
  hero:           HERO_DEFAULTS,
  contact:        CONTACT_DEFAULTS,
  about:          ABOUT_DEFAULTS,
  services_intro: SERVICES_INTRO_DEFAULTS,
  contact_intro:  CONTACT_INTRO_DEFAULTS,
  materials:      MATERIALS_DEFAULTS,
  reviews:        REVIEWS_DEFAULTS,
  big_cta:        BIG_CTA_DEFAULTS,
  footer:         FOOTER_DEFAULTS,
  theme:          THEME_DEFAULTS,
  settings:       SETTINGS_DEFAULTS,
  visibility:     VISIBILITY_DEFAULTS
};
// Array sections — name → { defaults: [], itemKeys: [] } so the API can
// validate each slot's allowed fields without a schema library.
export const ARRAY_SECTIONS = {
  pillars:        { defaults: PILLARS_DEFAULTS,        itemKeys: ['key', 'body'] },
  materials_rows: { defaults: MATERIALS_ROWS_DEFAULTS, itemKeys: ['name', 'detail', 'logo'] }
};

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
