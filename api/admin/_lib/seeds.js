// Default photo list seeded into the gallery on first admin visit.
//
// Schema per entry:
//   src      — public URL (relative path under /portfolio/ for static seeds)
//   label    — human-readable caption shown in the lightbox
//   category — service-category slug from src/services-meta.js, or null
//              for "uncategorised". Drives which service tile each photo
//              belongs to on the homepage.
//   featured — when true, this photo is the cover image on the service
//              tile. Exactly one per category (enforced by the API).
//
// Once the admin makes any edit, gallery.json in Blob storage takes over
// and these defaults are no longer consulted. Update here only if you
// need to change what a fresh install looks like.

export const SEED_PHOTOS = [
  // ── Shopfront & Building Signs ──
  { src: '/portfolio/install-19.webp', label: 'Storefront signage',     category: 'shopfront', featured: true },
  { src: '/portfolio/install-17.webp', label: 'Storefront signage',     category: 'shopfront' },
  { src: '/portfolio/install-34.webp', label: 'Storefront signage',     category: 'shopfront' },
  { src: '/portfolio/install-36.webp', label: 'Storefront signage',     category: 'shopfront' },
  { src: '/portfolio/install-07.webp', label: 'Storefront signage',     category: 'shopfront' },
  { src: '/portfolio/install-20.webp', label: 'Storefront signage',     category: 'shopfront' },
  { src: '/portfolio/install-11.webp', label: 'Storefront signage',     category: 'shopfront' },
  { src: '/portfolio/install-37.webp', label: 'Tradie signage',         category: 'shopfront' },

  // ── Illuminated Signs ──
  { src: '/portfolio/install-23.webp', label: 'Illuminated bar graphics', category: 'illuminated', featured: true },
  { src: '/portfolio/install-24.webp', label: 'Illuminated bar graphics', category: 'illuminated' },

  // ── Vehicle Wraps & Decals ──
  { src: '/portfolio/install-32.webp', label: 'Vehicle wrap',           category: 'vehicle', featured: true },
  { src: '/portfolio/install-38.webp', label: 'Vehicle wrap',           category: 'vehicle' },
  { src: '/portfolio/install-39.webp', label: 'Vending wrap',           category: 'vehicle' },
  { src: '/portfolio/vending-1.webp',  label: 'Vending wrap',           category: 'vehicle' },
  { src: '/portfolio/install-03.webp', label: 'Vending wrap',           category: 'vehicle' },

  // ── Banners, Flags & A-Frames ──
  { src: '/portfolio/install-26.webp', label: 'Banners',                category: 'banners', featured: true },
  { src: '/portfolio/install-27.webp', label: 'Hanging fabric banners', category: 'banners' },
  { src: '/portfolio/install-01.webp', label: 'Panels & promotional',   category: 'banners' },
  { src: '/portfolio/panel-1.webp',    label: 'Panels & acrylics',      category: 'banners' },
  { src: '/portfolio/panel-2.webp',    label: 'Panels & acrylics',      category: 'banners' },
  { src: '/portfolio/install-28.webp', label: 'Panels & acrylics',      category: 'banners' },
  { src: '/portfolio/install-02.webp', label: 'Panels & acrylics',      category: 'banners' },
  { src: '/portfolio/install-18.webp', label: 'Panels & acrylics',      category: 'banners' },
  { src: '/portfolio/install-40.webp', label: 'Panels & acrylics',      category: 'banners' },

  // ── Windows & Wall Graphics ──
  { src: '/portfolio/install-08.webp', label: 'Wall mural',             category: 'graphics', featured: true },
  { src: '/portfolio/install-04.webp', label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/install-13.webp', label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/install-15.webp', label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/install-05.webp', label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/install-29.webp', label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/install-14.webp', label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/install-16.webp', label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/install-33.webp', label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/wall-1.webp',     label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/wall-2.webp',     label: 'Wall graphics',          category: 'graphics' },
  { src: '/portfolio/install-21.webp', label: 'Window vinyl graphics',  category: 'graphics' },
  { src: '/portfolio/install-35.webp', label: 'Custom vinyl',           category: 'graphics' },
  { src: '/portfolio/install-09.webp', label: 'Privacy film',           category: 'graphics' },
  { src: '/portfolio/install-12.webp', label: 'Privacy film',           category: 'graphics' },
  { src: '/portfolio/install-22.webp', label: 'Privacy film',           category: 'graphics' },
  { src: '/portfolio/install-31.webp', label: 'Privacy film',           category: 'graphics' },
  { src: '/portfolio/install-06.webp', label: 'Custom privacy frosting', category: 'graphics' },
  { src: '/portfolio/privacy-1.webp',  label: 'Privacy film',           category: 'graphics' },
  { src: '/portfolio/privacy-2.webp',  label: 'Privacy film',           category: 'graphics' },
  { src: '/portfolio/privacy-3.webp',  label: 'Privacy film',           category: 'graphics' },

  // ── Pylons & Wayfinding ──
  // No specific pylon photos in the seed set — using the inhouse hero
  // shot as a placeholder cover until admin uploads real pylon work.
  { src: '/portfolio/hero.webp',       label: 'Inhouse production',     category: 'pylons', featured: true }
];
