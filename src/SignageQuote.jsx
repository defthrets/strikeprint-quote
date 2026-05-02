import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Loader2, AlertTriangle, Check, Camera, X, ChevronRight, Trash2, Type, Square, Lightbulb, Flag, Triangle, Car, MapPin, Navigation, EyeOff, Image as ImageIcon, Layers, Maximize2, Plus, Wrench, Send, Download, Printer, RotateCcw, RotateCw, Pencil, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LOGO_URL } from './logo.js';

// ═══════════════════════════════════════════════════════════════
//   STRIKE PRINT · QUOTE ESTIMATOR v0.8
//   Drag-and-drop composition editor + rules-based quoting.
//   No AI generation — everything is user-controlled.
// ═══════════════════════════════════════════════════════════════

const BRAND = {
  navy:           '#012659',
  navyDeep:       '#08152e',
  navyCard:       '#0f2046',
  navyRaise:      '#152954',
  navyLine:       'rgba(42, 67, 120, 0.4)',
  navyLineStrong: '#2a4378',
  textPri:        '#f1f5f9',
  textMuted:      '#94a3b8',
  textDim:        '#64748b',
  textFaint:      '#475569',
  boltOrange:     '#f0601f',
  boltAmber:      '#f59a10',
  boltYellow:     '#fad905',
  boltGrad:       'linear-gradient(135deg, #f0601f 0%, #f59a10 50%, #fad905 100%)'
};



// ═══════════════════════════════════════════════════════════════
//   EMAIL CONFIG
//   Quotes are dispatched server-side via the Vercel serverless
//   function at api/send-quote.js, which calls Resend.
//
//   To enable email send in production:
//     1. Sign up at https://resend.com (free 3000/mo)
//     2. Vercel → Project → Settings → Environment Variables:
//          RESEND_API_KEY = re_xxxxxxxxxxxxx
//        (optional override) QUOTE_RECIPIENT = mick@strikeprint.com.au
//        (optional override) QUOTE_FROM      = Strike Print <quotes@your-verified-domain>
//     3. Redeploy.
//
//   Until the env var is set, the form gracefully falls back to a
//   mailto: draft. The same fallback also kicks in during local
//   `npm run dev`, since Vite doesn't run Vercel functions.
// ═══════════════════════════════════════════════════════════════
const QUOTE_API_ENDPOINT = "/api/send-quote";
const RECIPIENT_EMAIL    = "mick@strikeprint.com.au"; // mailto fallback only

// ╔═══════════════════════════════════════════════════════════════════╗
// ║                                                                   ║
// ║   ⚙  PRICING CONFIG — EDIT THESE NUMBERS TO TUNE QUOTES           ║
// ║                                                                   ║
// ║   All prices are AUD, ex-GST (10% GST is added at quote time).    ║
// ║   Last updated: April 2026 — based on current AU market rates.    ║
// ║                                                                   ║
// ║   Changing a number here updates the quote engine immediately.    ║
// ║   No other files need to change. Commit + push and Vercel         ║
// ║   redeploys in ~30 seconds.                                       ║
// ║                                                                   ║
// ╚═══════════════════════════════════════════════════════════════════╝

// ───────────────────────────────────────────────────────────────────
//   1. SIGN PRODUCT CATALOGUE
// ───────────────────────────────────────────────────────────────────
//   Each entry needs:
//     name           → label shown to customer
//     perSqm         → supply price per m² (printing/fabrication)
//     installBase    → fixed installation cost (callout fee)
//     installPerSqm  → installation cost per m² of sign
//     minTotal       → minimum total before add-ons (covers small jobs)
//     sizes          → array of real-world size options, each with:
//                        id    → short identifier ('sm', 'md', 'lg', 'xl')
//                        label → name shown to customer
//                        w, h  → dimensions in millimetres
//                        spec  → display string (e.g. "1220 × 2440 mm")
//                        sqm   → computed area for pricing
//                        flatPrice → OPTIONAL fixed price for that size
//                                    (overrides perSqm calc — used for
//                                    fixed-price items like flags / A-frames)
//
//   QUOTE FORMULA per sign:
//     supply  = size.flatPrice ?? (perSqm × size.sqm)
//     install = installBase + (size.sqm × installPerSqm)
//     line    = max(supply + install, minTotal)
//
//   Then: subtotal = sum(lines) + sum(site_conditions)
//         total    = subtotal × (1 + GST_RATE)
// ───────────────────────────────────────────────────────────────────
const SIGN_CATALOGUE = {

  // ── STATIC PRINT ──

  // Vinyl Lettering — sized by letter height (typical 6-letter word)
  vinyl_lettering: {
    name: 'Vinyl Lettering', perSqm: 77, installBase: 146, installPerSqm: 32, minTotal: 178,
    description: 'Cut self-adhesive vinyl letters applied directly to glass, walls or panels. Best for clean text-only branding.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 600,  h: 100, spec: '100 mm letters',  sqm: 0.06 },
      { id: 'md', label: 'Medium', w: 1200, h: 200, spec: '200 mm letters',  sqm: 0.24 },
      { id: 'lg', label: 'Large',  w: 2400, h: 400, spec: '400 mm letters',  sqm: 0.96 },
      { id: 'xl', label: 'XL',     w: 3600, h: 600, spec: '600 mm letters',  sqm: 2.16 }
    ]
  },

  // Window Graphics — common storefront window sizes
  window_graphics: {
    name: 'Window Graphics', perSqm: 63, installBase: 91, installPerSqm: 22, minTotal: 145,
    description: 'Full-colour digital print on optically clear vinyl, applied to glass. Visible from outside while keeping good light through.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 600,  h: 900,  spec: '600 × 900 mm',    sqm: 0.54 },
      { id: 'md', label: 'Medium', w: 900,  h: 1500, spec: '900 × 1500 mm',   sqm: 1.35 },
      { id: 'lg', label: 'Large',  w: 1200, h: 2000, spec: '1200 × 2000 mm',  sqm: 2.40 },
      { id: 'xl', label: 'XL',     w: 2000, h: 3000, spec: '2000 × 3000 mm',  sqm: 6.00 }
    ]
  },

  // Window Frosting — frosted vinyl for privacy + branding (offices, boardrooms, shopfronts)
  window_frosting: {
    name: 'Window Frosting', perSqm: 66, installBase: 98, installPerSqm: 24, minTotal: 154,
    description: 'Frosted-effect cut vinyl on glass — adds privacy and a premium look to offices, boardrooms or shopfront panels. Logos and text can be cut into the frost.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 600,  h: 900,  spec: '600 × 900 mm (door / single panel)',  sqm: 0.54 },
      { id: 'md', label: 'Medium', w: 900,  h: 1500, spec: '900 × 1500 mm (boardroom)',           sqm: 1.35 },
      { id: 'lg', label: 'Large',  w: 1200, h: 2000, spec: '1200 × 2000 mm (office partition)',   sqm: 2.40 },
      { id: 'xl', label: 'XL',     w: 2000, h: 3000, spec: '2000 × 3000 mm (full shopfront)',     sqm: 6.00 }
    ]
  },

  // PVC Banner — standard banner sizes
  banner_pvc: {
    name: 'PVC Banner', perSqm: 61, installBase: 97, installPerSqm: 20, minTotal: 146,
    description: 'Heavy-duty 440 gsm PVC banner. Welded hems with brass eyelets for cable-tie or rope mounting, or keder edges for sailtrack and frame install.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 600,  h: 1500, spec: '600 × 1500 mm',   sqm: 0.90 },
      { id: 'md', label: 'Medium', w: 900,  h: 2400, spec: '900 × 2400 mm',   sqm: 2.16 },
      { id: 'lg', label: 'Large',  w: 1200, h: 3000, spec: '1200 × 3000 mm',  sqm: 3.60 },
      { id: 'xl', label: 'XL',     w: 1600, h: 6000, spec: '1600 × 6000 mm',  sqm: 9.60 }
    ]
  },

  // ACM Panel — standard composite panel sheet sizes
  acm_panel: {
    name: 'ACM Panel Sign', perSqm: 145, installBase: 127, installPerSqm: 32, minTotal: 218,
    description: 'Full custom digital print on ACM (aluminium composite) panel.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 750,  h: 1220, spec: '750 × 1220 mm',   sqm: 0.92 },
      { id: 'md', label: 'Medium', w: 1220, h: 2440, spec: '1220 × 2440 mm',  sqm: 2.98, flatPrice: 258 },  // standard sheet — flat-priced (line ≈ $480 inc install)
      { id: 'lg', label: 'Large',  w: 1500, h: 3000, spec: '1500 × 3000 mm',  sqm: 4.50 },
      { id: 'xl', label: 'XL',     w: 2000, h: 4000, spec: '2000 × 4000 mm',  sqm: 8.00 }
    ]
  },

  // Wall Graphic / Mural — large-format wall coverage
  wall_mural: {
    name: 'Wall Graphic', perSqm: 178, installBase: 227, installPerSqm: 57, minTotal: 340,
    description: 'Large-format printed vinyl applied directly to interior or exterior walls. Used for feature walls, branding murals or photographic backdrops.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 1500, h: 2000, spec: '1.5 × 2 m',       sqm: 3.00 },
      { id: 'md', label: 'Medium', w: 2500, h: 3500, spec: '2.5 × 3.5 m',     sqm: 8.75 },
      { id: 'lg', label: 'Large',  w: 4000, h: 5000, spec: '4 × 5 m',         sqm: 20.00 },
      { id: 'xl', label: 'XL',     w: 6000, h: 8000, spec: '6 × 8 m',         sqm: 48.00 }
    ]
  },

  // ── 3D / DIMENSIONAL ──

  // 3D Acrylic Letters — sized by letter height
  acrylic_3d_letters: {
    name: '3D Acrylic Letters', perSqm: 1021, installBase: 397, installPerSqm: 102, minTotal: 1247,
    description: 'Laser-cut 3D acrylic letters with stud-mounted standoffs from the wall. Modern, premium look — popular for office reception and retail interiors.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 600,  h: 100, spec: '100 mm letters',   sqm: 0.06 },
      { id: 'md', label: 'Medium', w: 1200, h: 200, spec: '200 mm letters',   sqm: 0.24 },
      { id: 'lg', label: 'Large',  w: 1800, h: 300, spec: '300 mm letters',   sqm: 0.54 },
      { id: 'xl', label: 'XL',     w: 2700, h: 450, spec: '450 mm letters',   sqm: 1.22 }
    ]
  },

  // Channel Letters — sized by letter height
  channel_letters: {
    name: 'Channel Letters', perSqm: 1944, installBase: 770, installPerSqm: 178, minTotal: 2430,
    description: 'Fabricated metal/acrylic letters with internal LED lighting (front-lit or halo-lit). The standard for major retail and commercial shopfront signage.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 1400, h: 200, spec: '200 mm letters',   sqm: 0.28 },
      { id: 'md', label: 'Medium', w: 2100, h: 300, spec: '300 mm letters',   sqm: 0.63 },
      { id: 'lg', label: 'Large',  w: 3150, h: 450, spec: '450 mm letters',   sqm: 1.42 },
      { id: 'xl', label: 'XL',     w: 4200, h: 600, spec: '600 mm letters',   sqm: 2.52 }
    ]
  },

  // ── ILLUMINATED ──

  // Lightbox — standard cabinet sizes
  lightbox: {
    name: 'Illuminated Lightbox', perSqm: 624, installBase: 340, installPerSqm: 79, minTotal: 850,
    description: 'Internally illuminated cabinet sign with translucent face and LED backlighting. Visible day or night — ideal for shopfronts and after-hours business.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 600,  h: 900,  spec: '600 × 900 mm',    sqm: 0.54 },
      { id: 'md', label: 'Medium', w: 900,  h: 1800, spec: '900 × 1800 mm',   sqm: 1.62 },
      { id: 'lg', label: 'Large',  w: 1200, h: 2400, spec: '1200 × 2400 mm',  sqm: 2.88 },
      { id: 'xl', label: 'XL',     w: 1500, h: 3000, spec: '1500 × 3000 mm',  sqm: 4.50 }
    ]
  },

  // ── STRUCTURAL ──

  // Pylon Sign — cabinet (face) size, pole adds to install cost
  pylon_sign: {
    name: 'Pylon / Pole Sign', perSqm: 1620, installBase: 1458, installPerSqm: 284, minTotal: 3402,
    description: 'Free-standing roadside sign on a steel pole with illuminated cabinet face. The big visibility play — service stations, shopping centres and roadside premises.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 600,  h: 1200, spec: '600 × 1200 mm cabinet · 3 m pole',   sqm: 0.72 },
      { id: 'md', label: 'Medium', w: 900,  h: 1800, spec: '900 × 1800 mm cabinet · 4 m pole',   sqm: 1.62 },
      { id: 'lg', label: 'Large',  w: 1200, h: 2400, spec: '1200 × 2400 mm cabinet · 5 m pole',  sqm: 2.88 },
      { id: 'xl', label: 'XL',     w: 1500, h: 3000, spec: '1500 × 3000 mm cabinet · 6 m pole',  sqm: 4.50 }
    ]
  },

  // Wayfinding Sign — small directional pylon, much cheaper than full pylon
  // Used for parking lots, building entries, hospital/business directories.
  wayfinding_sign: {
    name: 'Wayfinding Sign', perSqm: 648, installBase: 486, installPerSqm: 122, minTotal: 688,
    description: 'Compact directional sign on a pole — for car park entries, building directories, hospital and campus navigation.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 300, h: 1500, spec: '300 mm wide · 1.5 m tall',   sqm: 0.45 },
      { id: 'md', label: 'Medium', w: 400, h: 2000, spec: '400 mm wide · 2 m tall',     sqm: 0.80 },
      { id: 'lg', label: 'Large',  w: 500, h: 2500, spec: '500 mm wide · 2.5 m tall',   sqm: 1.25 },
      { id: 'xl', label: 'XL',     w: 600, h: 3000, spec: '600 mm wide · 3 m tall',     sqm: 1.80 }
    ]
  },

  // ── VEHICLE ──

  // Vehicle Decals — door / panel typical sizes
  vehicle_decals: {
    name: 'Vehicle Decals', perSqm: 89, installBase: 178, installPerSqm: 32, minTotal: 227,
    description: 'Print or cut vinyl applied to vehicle panels. Quoted for the area shown — full wraps and complex contours assessed on site.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 400,  h: 600,  spec: '400 × 600 mm (door)',    sqm: 0.24 },
      { id: 'md', label: 'Medium', w: 800,  h: 1200, spec: '800 × 1200 mm (panel)',  sqm: 0.96 },
      { id: 'lg', label: 'Large',  w: 1500, h: 2000, spec: '1500 × 2000 mm (side)',  sqm: 3.00 },
      { id: 'xl', label: 'XL',     w: 2500, h: 3000, spec: '2.5 × 3 m (full side)',  sqm: 7.50 }
    ]
  },

  // ── PORTABLE / EVENT ── (flat priced — flatPrice on each size)

  // Feather Flag — standard heights
  feather_flag: {
    name: 'Feather Flag', perSqm: 0, installBase: 49, installPerSqm: 0, minTotal: 202,
    description: 'Outdoor pole flag with stretch-fabric print. Includes pole, base and carry bag — quick to set up for events, sales and roadside attention.',
    sizes: [
      { id: 'sm', label: 'Small',  w: 700, h: 2400, spec: '2.4 m tall', sqm: 0.84, flatPrice: 194 },
      { id: 'md', label: 'Medium', w: 700, h: 3000, spec: '3 m tall',   sqm: 1.05, flatPrice: 235 },
      { id: 'lg', label: 'Large',  w: 700, h: 4500, spec: '4.5 m tall', sqm: 1.58, flatPrice: 308 },
      { id: 'xl', label: 'XL',     w: 700, h: 5500, spec: '5.5 m tall', sqm: 1.93, flatPrice: 373 }
    ]
  },

  // A-Frame — standard A-series sizes (common Australian sign sizes)
  a_frame: {
    name: 'A-Frame Footpath Sign', perSqm: 0, installBase: 32, installPerSqm: 0, minTotal: 162,
    description: 'Folding double-sided footpath sign for shopfronts, cafés and pop-ups. Lightweight, weatherproof, ready to deploy each morning.',
    sizes: [
      { id: 'sm', label: 'A2',  w: 450, h: 600,  spec: '450 × 600 mm (A2)',  sqm: 0.27, flatPrice: 146 },
      { id: 'md', label: 'A1',  w: 600, h: 900,  spec: '600 × 900 mm (A1)',  sqm: 0.54, flatPrice: 178 },
      { id: 'lg', label: 'A0',  w: 900, h: 1200, spec: '900 × 1200 mm (A0)', sqm: 1.08, flatPrice: 235 },
      { id: 'xl', label: 'XL',  w: 1200,h: 1800, spec: '1200 × 1800 mm',     sqm: 2.16, flatPrice: 340 }
    ]
  }
};

// Default size ID per sign — used when a placement is added.
// Pick whichever is the "typical" size customers usually order.
const DEFAULT_SIZE_ID = 'md';

// ───────────────────────────────────────────────────────────────────
//   3. SITE CONDITIONS — flat-fee additions to the quote
// ───────────────────────────────────────────────────────────────────
//   Each rule renders as a checkbox in the UI. When ticked it adds
//   `cost` to the quote as a separate line item.
//
//   To add a new rule: copy any line below, change the key/label/cost.
//   To remove one: delete that line.
//
//   Costs are typical 2026 AU rates. Adjust to your area / suppliers.
// ───────────────────────────────────────────────────────────────────
const SITE_CONDITIONS = {

  // Access equipment — needed when sign is above easy ladder reach
  high_access:    { label: 'Above 2 stories — lift required',     line: 'Lift / EWP hire',          cost: 700 },   // 6-8m scissor lift, 1 day + delivery
  scaffolding:    { label: 'Requires scaffolding',                line: 'Scaffolding hire',         cost: 1200 },  // multi-day setup

  // Permits / approvals
  permits:        { label: 'Council / road closure permit',       line: 'Permit application',      cost: 450 },
  heritage:       { label: 'Heritage zone — DA approval prep',    line: 'Heritage compliance',     cost: 350 },

  // Trades
  electrician:    { label: 'New power supply / wiring needed',    line: 'Electrician',             cost: 750 },   // ~6-8 hours licensed sparky

  // Site work
  removal:        { label: 'Old sign removal & disposal',         line: 'Removal & disposal',      cost: 250 },

  // Schedule / location surcharges
  afterhours:     { label: 'After-hours installation',            line: 'After-hours surcharge',   cost: 300 },
  travel:         { label: 'Outside metro / remote site',         line: 'Travel surcharge',        cost: 300 }
};

// ───────────────────────────────────────────────────────────────────
//   4. ARTWORK / DESIGN OPTIONS
// ───────────────────────────────────────────────────────────────────
//   Customer picks ONE of these. Tweak prices to match your design
//   rates, or add more tiers (e.g. "Logo from scratch" at $500).
// ───────────────────────────────────────────────────────────────────
const ARTWORK_OPTIONS = {
  supplied:      { label: 'I\'ll supply artwork',     desc: 'Print-ready files provided by customer', cost: 0 },
  basic_layout:  { label: 'Basic layout & setup',     desc: 'Logo + text laid out on the sign',       cost: 122 },
  full_design:   { label: 'Full design service',      desc: 'New artwork designed from brief',        cost: 284 }
};
const DEFAULT_ARTWORK = 'supplied';

// ───────────────────────────────────────────────────────────────────
//   5. GST RATE
// ───────────────────────────────────────────────────────────────────
const GST_RATE = 0.10;   // 10% Australian GST. Change if rate changes.

// ╔═══════════════════════════════════════════════════════════════════╗
// ║   END OF PRICING CONFIG — code below is the app itself.           ║
// ╚═══════════════════════════════════════════════════════════════════╝


// ═══════════════════════════════════════════════════════════════
//   TEMPLATE LIBRARY — visual presets users drag onto the photo.
//   Each template renders as inline SVG with brand colours.
//   Replace these with real product images later.
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//   DISCLAIMER WATERMARK — stamped onto every exported composite.
//   Two layers: diagonal repeating tile + bottom banner.
// ═══════════════════════════════════════════════════════════════
const drawDisclaimerWatermark = (ctx, w, h) => {
  ctx.save();

  // ─── Layer 1: diagonal repeating "ESTIMATE ONLY" tile ───
  const fontSize = Math.max(14, Math.round(w * 0.022));
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = Math.max(1, fontSize * 0.06);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const tileText = '  ESTIMATE ONLY  •  SUBJECT TO SITE INSPECTION  ';
  const tileW = ctx.measureText(tileText).width;
  const stepX = tileW;
  const stepY = fontSize * 4;
  const angle = -Math.PI / 6; // -30° tilt

  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);
  // Cover well past corners after rotation
  const diag = Math.sqrt(w * w + h * h);
  for (let y = -diag; y < diag; y += stepY) {
    // Stagger every other row for a softer pattern
    const offset = (Math.round(y / stepY) % 2 === 0) ? 0 : tileW / 2;
    for (let x = -diag + offset; x < diag; x += stepX) {
      ctx.strokeText(tileText, x, y);
      ctx.fillText(tileText, x, y);
    }
  }
  ctx.restore();

  // ─── Layer 2: bottom banner with full disclaimer ───
  ctx.save();
  const bannerH = Math.max(50, Math.round(h * 0.085));
  const bannerY = h - bannerH;

  // Semi-transparent dark gradient backing
  const grad = ctx.createLinearGradient(0, bannerY, 0, h);
  grad.addColorStop(0, 'rgba(8, 21, 46, 0.0)');
  grad.addColorStop(0.35, 'rgba(8, 21, 46, 0.75)');
  grad.addColorStop(1, 'rgba(8, 21, 46, 0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, bannerY, w, bannerH);

  // Amber accent line along the top of the banner
  ctx.fillStyle = 'rgba(245, 154, 16, 0.85)';
  ctx.fillRect(0, bannerY, w, Math.max(2, Math.round(h * 0.003)));

  // Disclaimer text — two lines
  const titleSize = Math.max(13, Math.round(w * 0.018));
  const subSize   = Math.max(10, Math.round(w * 0.013));
  const padX = Math.max(16, Math.round(w * 0.025));
  const titleY = bannerY + bannerH * 0.42;
  const subY   = bannerY + bannerH * 0.78;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  ctx.font = `bold ${titleSize}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(245, 154, 16, 1)';
  ctx.fillText('INDICATIVE ESTIMATE ONLY', padX, titleY);

  ctx.font = `${subSize}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(241, 245, 249, 0.95)';
  ctx.fillText('Final quote subject to change after on-site inspection · Strike Print', padX, subY);

  ctx.restore();
};

const isLight = (hex) => {
  if (!hex) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0,2), 16) || 0;
  const g = parseInt(c.slice(2,4), 16) || 0;
  const b = parseInt(c.slice(4,6), 16) || 0;
  return (r*0.299 + g*0.587 + b*0.114) > 160;
};

const colourOr = (val, fallback) => (val && val !== '') ? val : fallback;

// ───────────────────────────────────────────────────────────────────
//   SIGN VISUAL RENDERERS — each returns an SVG representation
//   matching the real-world look of that sign type.
// ───────────────────────────────────────────────────────────────────
const SIGN_RENDERS = {

  // ──── ACM PANEL — flat aluminium composite with mounting bolts ────
  panel: ({ text, brand, primaryOverride, secondaryOverride }) => {
    const bg = colourOr(primaryOverride || brand.primary_color, '#012659');
    const fg = colourOr(secondaryOverride || (isLight(bg) ? brand.primary_color : '#ffffff'), '#ffffff');
    return (
      <svg viewBox="0 0 220 100" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="acmEdge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#888"/>
            <stop offset="0.5" stopColor="#bbb"/>
            <stop offset="1" stopColor="#666"/>
          </linearGradient>
          <filter id="acmShadow"><feDropShadow dx="0" dy="3" stdDeviation="2.5" floodOpacity="0.5"/></filter>
          <linearGradient id="acmFaceShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.18"/>
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0"/>
            <stop offset="1" stopColor="#000000" stopOpacity="0.08"/>
          </linearGradient>
        </defs>
        {/* Brushed aluminium edge frame */}
        <rect x="3" y="3" width="214" height="94" fill="url(#acmEdge)" filter="url(#acmShadow)" rx="3"/>
        {/* Face */}
        <rect x="6" y="6" width="208" height="88" fill={bg} rx="2"/>
        {/* Face shine */}
        <rect x="6" y="6" width="208" height="88" fill="url(#acmFaceShine)" rx="2"/>
        {/* Mounting bolts at corners */}
        <circle cx="14" cy="14" r="2.2" fill="#222" opacity="0.7"/>
        <circle cx="206" cy="14" r="2.2" fill="#222" opacity="0.7"/>
        <circle cx="14" cy="86" r="2.2" fill="#222" opacity="0.7"/>
        <circle cx="206" cy="86" r="2.2" fill="#222" opacity="0.7"/>
        <text x="110" y="62" fontSize="26" fontFamily="'Bebas Neue', sans-serif" fontWeight="700"
              fill={fg} textAnchor="middle" letterSpacing="1.5">
          {(text || '').toUpperCase().slice(0, 22)}
        </text>
      </svg>
    );
  },

  // ──── LIGHTBOX — glowing illuminated box with aluminium frame ────
  lightbox: ({ text, brand, primaryOverride }) => {
    const accent = colourOr(primaryOverride || brand.primary_color, '#012659');
    return (
      <svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="lbFrame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#777"/>
            <stop offset="0.5" stopColor="#333"/>
            <stop offset="1" stopColor="#111"/>
          </linearGradient>
          <radialGradient id="lbGlow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#ffffe6" stopOpacity="1"/>
            <stop offset="55%" stopColor="#ffe7a0" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#ffc14d" stopOpacity="0.75"/>
          </radialGradient>
          <filter id="lbDrop"><feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.6"/></filter>
          <filter id="lbBlur"><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        {/* Outer dark aluminium frame */}
        <rect x="2" y="2" width="236" height="106" fill="url(#lbFrame)" rx="4" filter="url(#lbDrop)"/>
        {/* Glowing acrylic face */}
        <rect x="9" y="9" width="222" height="92" fill="url(#lbGlow)" rx="2"/>
        {/* Top highlight */}
        <rect x="9" y="9" width="222" height="22" fill="#ffffff" opacity="0.28" rx="2"/>
        {/* LED glow spillover */}
        <ellipse cx="120" cy="55" rx="100" ry="38" fill="#ffffff" opacity="0.35" filter="url(#lbBlur)"/>
        <text x="120" y="68" fontSize="34" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill={accent} textAnchor="middle" letterSpacing="2">
          {(text || '').toUpperCase().slice(0, 14)}
        </text>
      </svg>
    );
  },

  // ──── CHANNEL LETTERS — fabricated 3D letters with halo glow ────
  channel: ({ text, brand, primaryOverride }) => {
    const c = colourOr(primaryOverride || brand.primary_color, '#012659');
    const safeText = (text || '').toUpperCase().slice(0, 14);
    return (
      <svg viewBox="0 0 240 90" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id="chHalo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5"/>
          </filter>
          <filter id="chDepth"><feDropShadow dx="2" dy="3" stdDeviation="0.5" floodColor="#000" floodOpacity="0.75"/></filter>
        </defs>
        {/* Halo glow */}
        <text x="120" y="60" fontSize="48" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill={c} opacity="0.55" filter="url(#chHalo)" textAnchor="middle" letterSpacing="3">{safeText}</text>
        {/* Side return shadow (3D depth) */}
        <text x="123" y="63" fontSize="48" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill="#000" opacity="0.4" textAnchor="middle" letterSpacing="3">{safeText}</text>
        {/* Main face */}
        <text x="120" y="60" fontSize="48" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill={c} textAnchor="middle" letterSpacing="3" filter="url(#chDepth)">{safeText}</text>
        {/* Top face shine */}
        <text x="120" y="59" fontSize="48" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill="#ffffff" opacity="0.22" textAnchor="middle" letterSpacing="3">{safeText}</text>
      </svg>
    );
  },

  // ──── 3D ACRYLIC LETTERS — built-up letters with stand-off shadow ────
  acrylic3d: ({ text, brand, primaryOverride }) => {
    const c = colourOr(primaryOverride || brand.primary_color, '#012659');
    const safeText = (text || '').toUpperCase().slice(0, 14);
    return (
      <svg viewBox="0 0 240 80" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id="acDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5"/>
          </filter>
        </defs>
        {/* Soft wall shadow (stand-off mounting) */}
        <text x="124" y="58" fontSize="46" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill="#000" opacity="0.35" filter="url(#acDropShadow)" textAnchor="middle" letterSpacing="2">{safeText}</text>
        {/* Stack offsets for layered depth */}
        <text x="123" y="57" fontSize="46" fontFamily="'Bebas Neue', sans-serif" fontWeight="900" fill="#000" opacity="0.5" textAnchor="middle" letterSpacing="2">{safeText}</text>
        <text x="122" y="56" fontSize="46" fontFamily="'Bebas Neue', sans-serif" fontWeight="900" fill="#000" opacity="0.45" textAnchor="middle" letterSpacing="2">{safeText}</text>
        <text x="121" y="55" fontSize="46" fontFamily="'Bebas Neue', sans-serif" fontWeight="900" fill="#000" opacity="0.4" textAnchor="middle" letterSpacing="2">{safeText}</text>
        {/* Main acrylic face */}
        <text x="120" y="54" fontSize="46" fontFamily="'Bebas Neue', sans-serif" fontWeight="900" fill={c} textAnchor="middle" letterSpacing="2">{safeText}</text>
        {/* Glossy top highlight */}
        <text x="120" y="53" fontSize="46" fontFamily="'Bebas Neue', sans-serif" fontWeight="900" fill="#ffffff" opacity="0.18" textAnchor="middle" letterSpacing="2">{safeText}</text>
      </svg>
    );
  },

  // ──── VINYL LETTERING — flat cut vinyl, no background ────
  vinyl: ({ text, brand, primaryOverride }) => {
    const c = colourOr(primaryOverride || brand.primary_color, '#012659');
    return (
      <svg viewBox="0 0 220 60" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id="vnSubtleShadow"><feDropShadow dx="1" dy="1" stdDeviation="0.4" floodOpacity="0.35"/></filter>
        </defs>
        <text x="110" y="42" fontSize="32" fontFamily="Outfit, sans-serif" fontWeight="800"
              fill={c} textAnchor="middle" filter="url(#vnSubtleShadow)">
          {(text || '').slice(0, 20)}
        </text>
      </svg>
    );
  },

  // ──── WINDOW GRAPHIC — vinyl on transparent glass with frame ────
  window: ({ text, brand, primaryOverride }) => {
    const c = colourOr(primaryOverride || brand.primary_color, '#012659');
    return (
      <svg viewBox="0 0 220 100" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="winGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#cfe4f5" stopOpacity="0.35"/>
            <stop offset="0.5" stopColor="#a8c8e6" stopOpacity="0.2"/>
            <stop offset="1" stopColor="#88aacc" stopOpacity="0.3"/>
          </linearGradient>
          <linearGradient id="winFrame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#666"/>
            <stop offset="1" stopColor="#333"/>
          </linearGradient>
        </defs>
        {/* Window frame */}
        <rect x="0" y="0" width="220" height="100" fill="url(#winFrame)" rx="2"/>
        {/* Glass pane */}
        <rect x="6" y="6" width="208" height="88" fill="url(#winGlass)"/>
        {/* Diagonal reflection streak */}
        <polygon points="6,6 60,6 30,94 6,94" fill="#ffffff" opacity="0.12"/>
        {/* Cross divider (window mullions) */}
        <line x1="110" y1="6" x2="110" y2="94" stroke="#444" strokeWidth="2"/>
        {/* Vinyl text */}
        <text x="110" y="58" fontSize="22" fontFamily="Outfit, sans-serif" fontWeight="700"
              fill={c} textAnchor="middle" letterSpacing="0.5">
          {(text || '').slice(0, 20)}
        </text>
      </svg>
    );
  },

  // ──── WINDOW FROSTING — privacy band with cut-out clear text effect ────
  frosting: ({ text, brand }) => {
    return (
      <svg viewBox="0 0 220 100" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="frGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#cfe4f5" stopOpacity="0.4"/>
            <stop offset="0.5" stopColor="#a8c8e6" stopOpacity="0.25"/>
            <stop offset="1" stopColor="#88aacc" stopOpacity="0.35"/>
          </linearGradient>
          <linearGradient id="frFrame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#666"/>
            <stop offset="1" stopColor="#333"/>
          </linearGradient>
          <linearGradient id="frFrostBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85"/>
            <stop offset="0.5" stopColor="#e8eef5" stopOpacity="0.92"/>
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.85"/>
          </linearGradient>
          {/* Hatched/dotted texture for the frosting */}
          <pattern id="frFrostTexture" patternUnits="userSpaceOnUse" width="3" height="3">
            <rect width="3" height="3" fill="transparent"/>
            <circle cx="0.7" cy="0.7" r="0.45" fill="#ffffff" opacity="0.7"/>
            <circle cx="2.2" cy="2.2" r="0.45" fill="#ffffff" opacity="0.5"/>
          </pattern>
        </defs>
        {/* Window frame */}
        <rect x="0" y="0" width="220" height="100" fill="url(#frFrame)" rx="2"/>
        {/* Glass pane (clearer than window graphic to show frosted band stands out) */}
        <rect x="6" y="6" width="208" height="88" fill="url(#frGlass)"/>
        {/* Diagonal reflection streak (above the frost) */}
        <polygon points="6,6 50,6 28,38 6,38" fill="#ffffff" opacity="0.18"/>
        {/* Mullion divider behind */}
        <line x1="110" y1="6" x2="110" y2="94" stroke="#444" strokeWidth="2" opacity="0.5"/>
        {/* The privacy frost band — the hero element of this template */}
        <rect x="6" y="36" width="208" height="32" fill="url(#frFrostBand)"/>
        <rect x="6" y="36" width="208" height="32" fill="url(#frFrostTexture)"/>
        {/* Thin trim lines top + bottom of frost band (typical of cut vinyl edges) */}
        <line x1="6" y1="36" x2="214" y2="36" stroke="#aac" strokeWidth="0.5" opacity="0.6"/>
        <line x1="6" y1="68" x2="214" y2="68" stroke="#aac" strokeWidth="0.5" opacity="0.6"/>
        {/* Cut-out text: appears as clear glass through the frost (slight dark text suggesting view through) */}
        <text x="110" y="59" fontSize="18" fontFamily="Outfit, sans-serif" fontWeight="700"
              fill="#1a3050" opacity="0.55" textAnchor="middle" letterSpacing="0.6">
          {(text || '').slice(0, 22)}
        </text>
      </svg>
    );
  },

  // ──── PVC BANNER — fabric banner with grommets and hemmed edges ────
  banner: ({ text, brand, primaryOverride, secondaryOverride }) => {
    const bg = colourOr(primaryOverride || brand.primary_color, '#012659');
    const fg = colourOr(secondaryOverride, '#ffffff');
    return (
      <svg viewBox="0 0 280 100" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="bnFabricShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.15"/>
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0"/>
            <stop offset="1" stopColor="#000000" stopOpacity="0.12"/>
          </linearGradient>
        </defs>
        {/* Banner with subtle sag curves top and bottom */}
        <path d="M 8 8 Q 140 14 272 8 L 272 92 Q 140 86 8 92 Z" fill={bg}/>
        <path d="M 8 8 Q 140 14 272 8 L 272 92 Q 140 86 8 92 Z" fill="url(#bnFabricShine)"/>
        {/* Hemmed edge top */}
        <path d="M 8 8 Q 140 14 272 8" stroke="#000" strokeOpacity="0.25" strokeWidth="1.5" fill="none"/>
        {/* Hemmed edge bottom */}
        <path d="M 8 92 Q 140 86 272 92" stroke="#000" strokeOpacity="0.25" strokeWidth="1.5" fill="none"/>
        {/* Brass grommets at corners */}
        <circle cx="16" cy="15" r="4" fill="#cca64a" stroke="#7a5f1c" strokeWidth="0.7"/>
        <circle cx="264" cy="15" r="4" fill="#cca64a" stroke="#7a5f1c" strokeWidth="0.7"/>
        <circle cx="16" cy="85" r="4" fill="#cca64a" stroke="#7a5f1c" strokeWidth="0.7"/>
        <circle cx="264" cy="85" r="4" fill="#cca64a" stroke="#7a5f1c" strokeWidth="0.7"/>
        {/* Grommet inner holes */}
        <circle cx="16" cy="15" r="1.6" fill="#000"/>
        <circle cx="264" cy="15" r="1.6" fill="#000"/>
        <circle cx="16" cy="85" r="1.6" fill="#000"/>
        <circle cx="264" cy="85" r="1.6" fill="#000"/>
        <text x="140" y="58" fontSize="28" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill={fg} textAnchor="middle" letterSpacing="2">
          {(text || '').toUpperCase().slice(0, 20)}
        </text>
      </svg>
    );
  },

  // ──── PYLON SIGN — fuel-price-sign style with brand header + stacked panels ────
  pylon: ({ text, brand, primaryOverride, secondaryOverride }) => {
    const bg = colourOr(primaryOverride || brand.primary_color, '#012659');
    const accent = colourOr(secondaryOverride || brand.secondary_color, '#fad905');
    const safeText = (text || '').toUpperCase().slice(0, 10);
    return (
      <svg viewBox="0 0 100 240" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <filter id="pyShadow"><feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.55"/></filter>
          <linearGradient id="pyPole" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3a3a3a"/>
            <stop offset="0.4" stopColor="#999"/>
            <stop offset="0.55" stopColor="#dcdcdc"/>
            <stop offset="0.7" stopColor="#999"/>
            <stop offset="1" stopColor="#3a3a3a"/>
          </linearGradient>
          <linearGradient id="pyBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#888"/>
            <stop offset="1" stopColor="#444"/>
          </linearGradient>
          <linearGradient id="pyFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.2"/>
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0"/>
            <stop offset="1" stopColor="#000000" stopOpacity="0.12"/>
          </linearGradient>
          <linearGradient id="pyHeaderShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.25"/>
            <stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Concrete base */}
        <rect x="28" y="220" width="44" height="14" fill="url(#pyBase)" rx="1"/>
        <ellipse cx="50" cy="236" rx="28" ry="3" fill="#000" opacity="0.4"/>

        {/* Slim steel pole (narrower than cabinet — fuel-sign style) */}
        <rect x="46" y="170" width="8" height="52" fill="url(#pyPole)"/>

        {/* Tall cabinet — dark frame */}
        <rect x="4" y="4" width="92" height="166" fill="#0c0c0c" stroke="#000" strokeWidth="0.6" rx="3" filter="url(#pyShadow)"/>

        {/* Brand header band (taller than original) */}
        <rect x="8" y="8" width="84" height="32" fill={bg}/>
        <rect x="8" y="8" width="84" height="14" fill="url(#pyHeaderShine)"/>
        <text x="50" y="30" fontSize="14" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill="#ffffff" textAnchor="middle" letterSpacing="1.5">
          {safeText}
        </text>

        {/* Empty price-slot bars — 4 horizontal segments stacked */}
        <rect x="8" y="44" width="84" height="28" fill="#f3f3ec"/>
        <rect x="8" y="76" width="84" height="28" fill="#f3f3ec"/>
        <rect x="8" y="108" width="84" height="28" fill="#f3f3ec"/>
        <rect x="8" y="140" width="84" height="28" fill="#f3f3ec"/>

        {/* Thin separators between slots (suggesting LCD/LED price digits) */}
        <line x1="8" y1="72" x2="92" y2="72" stroke="#000" strokeOpacity="0.3" strokeWidth="0.6"/>
        <line x1="8" y1="104" x2="92" y2="104" stroke="#000" strokeOpacity="0.3" strokeWidth="0.6"/>
        <line x1="8" y1="136" x2="92" y2="136" stroke="#000" strokeOpacity="0.3" strokeWidth="0.6"/>

        {/* Accent indicator stripe down the left edge of each slot */}
        <rect x="8" y="44" width="3" height="28" fill={accent}/>
        <rect x="8" y="76" width="3" height="28" fill={accent} opacity="0.85"/>
        <rect x="8" y="108" width="3" height="28" fill={accent} opacity="0.7"/>
        <rect x="8" y="140" width="3" height="28" fill={accent} opacity="0.55"/>

        {/* Glossy face highlight */}
        <rect x="4" y="4" width="92" height="166" fill="url(#pyFace)" rx="3"/>
      </svg>
    );
  },

  // ──── WAYFINDING SIGN — single rectangle on a small pole ────
  wayfinding: ({ text, brand, primaryOverride, secondaryOverride }) => {
    const bg = colourOr(primaryOverride || brand.primary_color, '#012659');
    const fg = colourOr(secondaryOverride || (isLight(bg) ? '#012659' : '#ffffff'), '#ffffff');
    const safeText = (text || '').toUpperCase().slice(0, 14);
    return (
      <svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <filter id="wfShadow"><feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.5"/></filter>
          <linearGradient id="wfPole" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#333"/>
            <stop offset="0.4" stopColor="#aaa"/>
            <stop offset="0.6" stopColor="#ddd"/>
            <stop offset="1" stopColor="#333"/>
          </linearGradient>
          <linearGradient id="wfShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.2"/>
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0"/>
            <stop offset="1" stopColor="#000000" stopOpacity="0.1"/>
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="50" cy="135" rx="18" ry="2.5" fill="#000" opacity="0.4"/>

        {/* Small pole coming out the bottom */}
        <rect x="46" y="78" width="8" height="55" fill="url(#wfPole)"/>

        {/* Single rectangular sign panel */}
        <rect x="6" y="6" width="88" height="74" fill={bg} stroke="#222" strokeWidth="0.5" rx="2" filter="url(#wfShadow)"/>

        {/* Glossy face shine */}
        <rect x="6" y="6" width="88" height="74" fill="url(#wfShine)" rx="2"/>

        {/* Text on the sign */}
        <text x="50" y="48" fontSize="14" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill={fg} textAnchor="middle" letterSpacing="1">{safeText}</text>
      </svg>
    );
  },


  // ──── FEATHER FLAG — tapered flag on pole with stake base ────
  flag: ({ text, brand, primaryOverride }) => {
    const c = colourOr(primaryOverride || brand.primary_color, '#012659');
    const safeText = (text || '').toUpperCase().slice(0, 14);
    return (
      <svg viewBox="0 0 70 220" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="flgPole" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#222"/>
            <stop offset="0.5" stopColor="#888"/>
            <stop offset="1" stopColor="#222"/>
          </linearGradient>
          <linearGradient id="flgFabric" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.15"/>
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0"/>
            <stop offset="1" stopColor="#000000" stopOpacity="0.18"/>
          </linearGradient>
        </defs>
        {/* Cross-base spike (X-frame at bottom) */}
        <line x1="6" y1="216" x2="34" y2="206" stroke="#333" strokeWidth="2"/>
        <line x1="34" y1="216" x2="6" y2="206" stroke="#333" strokeWidth="2"/>
        {/* Steel pole */}
        <rect x="18" y="2" width="4" height="208" fill="url(#flgPole)"/>
        {/* Flag — teardrop curve */}
        <path d="M 22 4 Q 62 30 62 105 Q 62 180 22 198 L 22 4 Z" fill={c}/>
        {/* Fabric shading */}
        <path d="M 22 4 Q 62 30 62 105 Q 62 180 22 198 L 22 4 Z" fill="url(#flgFabric)"/>
        {/* Subtle wind ripple lines */}
        <path d="M 30 60 Q 45 63 56 60" stroke="#000" strokeOpacity="0.12" strokeWidth="0.6" fill="none"/>
        <path d="M 30 130 Q 45 133 56 130" stroke="#000" strokeOpacity="0.12" strokeWidth="0.6" fill="none"/>
        {/* Vertical text along the flag */}
        <text x="42" y="108" fontSize="18" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill="#ffffff" textAnchor="middle" letterSpacing="2"
              transform="rotate(-90 42 108)">{safeText}</text>
      </svg>
    );
  },

  // ──── A-FRAME — flat front-on rectangular sign ────
  aframe: ({ text, brand, primaryOverride, secondaryOverride }) => {
    const bg = colourOr(primaryOverride || brand.primary_color, '#012659');
    const fg = colourOr(secondaryOverride || (isLight(bg) ? '#012659' : '#ffffff'), '#ffffff');
    return (
      <svg viewBox="0 0 180 240" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <filter id="afShadow"><feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.45"/></filter>
          <linearGradient id="afFaceShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.18"/>
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0"/>
            <stop offset="1" stopColor="#000000" stopOpacity="0.1"/>
          </linearGradient>
          <linearGradient id="afFrame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#888"/>
            <stop offset="1" stopColor="#444"/>
          </linearGradient>
        </defs>
        {/* Ground shadow */}
        <ellipse cx="90" cy="232" rx="60" ry="3" fill="#000" opacity="0.35"/>
        {/* Outer frame */}
        <rect x="6" y="6" width="168" height="220" fill="url(#afFrame)" rx="3" filter="url(#afShadow)"/>
        {/* Sign face */}
        <rect x="12" y="12" width="156" height="208" fill={bg} rx="2"/>
        {/* Face shine */}
        <rect x="12" y="12" width="156" height="208" fill="url(#afFaceShine)" rx="2"/>
        {/* Carry handle / hinge cutout at top */}
        <rect x="76" y="3" width="28" height="6" fill="#222" rx="1"/>
        {/* Text */}
        <text x="90" y="125" fontSize="26" fontFamily="'Bebas Neue', sans-serif" fontWeight="900"
              fill={fg} textAnchor="middle" letterSpacing="1.5">
          {(text || '').toUpperCase().slice(0, 10)}
        </text>
      </svg>
    );
  }
};

// ───────────────────────────────────────────────────────────────────
//   TEMPLATE LIBRARY — defaults for the sidebar thumbnails.
//   defaultText is the placeholder used when the template is dropped
//   onto the photo (user can edit afterwards via the selection panel).
//   Each thumbnail shows the type name so customers see what each is.
// ───────────────────────────────────────────────────────────────────
const TEMPLATE_LIBRARY = [
  { id: 'tpl_acm',      name: 'ACM Panel',       sign: 'acm_panel',          aspect: 0.45, defaultText: 'ACM PANEL',      style: 'panel',     icon: Square },
  { id: 'tpl_lightbox', name: 'Lightbox',        sign: 'lightbox',           aspect: 0.46, defaultText: 'LIGHTBOX',       style: 'lightbox',  icon: Lightbulb },
  { id: 'tpl_3d',       name: '3D Acrylic',      sign: 'acrylic_3d_letters', aspect: 0.33, defaultText: '3D ACRYLIC',     style: 'acrylic3d', icon: Type },
  { id: 'tpl_vinyl',    name: 'Vinyl Letters',   sign: 'vinyl_lettering',    aspect: 0.27, defaultText: 'VINYL',          style: 'vinyl',     icon: Type },
  { id: 'tpl_window',      name: 'Window Graphic', sign: 'window_graphics',    aspect: 0.45, defaultText: 'VINYL GRAPHICS', style: 'window',    icon: Square,   defaultRotation: 90 },
  { id: 'tpl_frosting',    name: 'Window Frost',   sign: 'window_frosting',    aspect: 0.45, defaultText: 'FROSTING',       style: 'frosting',  icon: EyeOff,   defaultRotation: 90 },
  { id: 'tpl_banner',   name: 'PVC Banner',      sign: 'banner_pvc',         aspect: 0.36, defaultText: 'BANNER',         style: 'banner',    icon: Flag },
  { id: 'tpl_pylon',       name: 'Pylon Sign',     sign: 'pylon_sign',         aspect: 2.4,  defaultText: 'PYLON',          style: 'pylon',      icon: MapPin },
  { id: 'tpl_wayfinding',  name: 'Wayfinding',     sign: 'wayfinding_sign',    aspect: 1.4,  defaultText: 'WAYFINDING',     style: 'wayfinding', icon: Navigation },
  { id: 'tpl_flag',     name: 'Feather Flag',    sign: 'feather_flag',       aspect: 3.14, defaultText: 'FEATHER FLAG',   style: 'flag',      icon: Flag },
  { id: 'tpl_aframe',   name: 'A-Frame',         sign: 'a_frame',            aspect: 1.33, defaultText: 'A-FRAME',        style: 'aframe',    icon: Triangle }
];

// ═══════════════════════════════════════════════════════════════
//   QUOTE STATE PERSISTENCE — URL hash + localStorage
// ═══════════════════════════════════════════════════════════════
//
// The quote's lightweight state (placements, conditions, artwork) is encoded
// into the URL hash so the user can bookmark / share / refresh and pick up
// where they left off. The site photo is too large for a URL — it's saved
// to localStorage on the same device for personal continuity, but doesn't
// follow a shared link to another device. (A recipient who opens a shared
// link without the photo lands on the photo-upload stage, then the saved
// placements rehydrate once they upload an image of their own.)
//
const QUOTE_HASH_PREFIX = '#q=';
const PHOTO_STORAGE_KEY = 'strikeprint:photo';

const encodeQuoteState = ({ placements, conditions, artwork }) => {
  try {
    const data = {
      v: 1,
      p: placements,
      c: Array.from(conditions || []),
      a: artwork
    };
    // UTF-8-safe base64 (sign text may include non-ASCII characters)
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  } catch { return ''; }
};

const decodeQuoteState = (encoded) => {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    if (!data || data.v !== 1) return null;
    // Filter out placements referring to templates that no longer exist
    // (graceful migration if the catalogue ever changes IDs).
    const knownIds = new Set(TEMPLATE_LIBRARY.map(t => t.id));
    return {
      placements: (data.p || []).filter(p => p && knownIds.has(p.templateId)),
      conditions: new Set(data.c || []),
      artwork:    typeof data.a === 'string' ? data.a : DEFAULT_ARTWORK
    };
  } catch { return null; }
};

// ═══════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function SignageQuoteBuilder() {
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [photoMime, setPhotoMime] = useState('image/jpeg');

  // brand colours — empty by default. Per-sign overrides live on each placement.
  const brand = { primary_color: '', secondary_color: '' };

  // Placements: array of { id, templateId, x, y, w, text, primaryOverride, secondaryOverride, size }
  // x, y, w are normalised 0-1 (height computed from template aspect)
  const [placements, setPlacements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Site conditions
  const [conditions, setConditions] = useState(new Set());
  // Artwork / design choice
  const [artwork, setArtwork] = useState(DEFAULT_ARTWORK);

  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const photoInputRef  = useRef(null);
  const cameraInputRef = useRef(null);

  // Brief feedback toggle for the "Copy quote link" button.
  const [shareCopied, setShareCopied] = useState(false);

  // 'How it works' intro modal — shown once per device on the first visit
  // to Stage 1. Dismissal persists in localStorage. Available later via the
  // 'How it works' link beside the section header so returning users can
  // bring it back manually.
  const [showHowTo, setShowHowTo] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem('strikeprint:howToSeen')) setShowHowTo(true);
    } catch {}
  }, []);
  const dismissHowTo = () => {
    setShowHowTo(false);
    try { localStorage.setItem('strikeprint:howToSeen', '1'); } catch {}
  };

  // ─── Restore on mount: photo from localStorage, quote state from URL hash ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PHOTO_STORAGE_KEY);
      if (saved && saved.startsWith('data:')) setPhotoDataUrl(saved);
    } catch {}

    const hash = (typeof window !== 'undefined' && window.location.hash) || '';
    if (hash.startsWith(QUOTE_HASH_PREFIX)) {
      const decoded = decodeQuoteState(hash.slice(QUOTE_HASH_PREFIX.length));
      if (decoded) {
        if (decoded.placements.length) setPlacements(decoded.placements);
        if (decoded.conditions.size)   setConditions(decoded.conditions);
        if (decoded.artwork)           setArtwork(decoded.artwork);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Persist photo to localStorage (per-device convenience) ───
  useEffect(() => {
    if (!photoDataUrl) {
      try { localStorage.removeItem(PHOTO_STORAGE_KEY); } catch {}
      return;
    }
    try {
      localStorage.setItem(PHOTO_STORAGE_KEY, photoDataUrl);
    } catch {
      // Quota exceeded — store a downscaled copy so refresh-restore still works
      downscaleDataUrl(photoDataUrl, 1200, 0.7).then(small => {
        try { localStorage.setItem(PHOTO_STORAGE_KEY, small); } catch {}
      }).catch(() => {});
    }
  }, [photoDataUrl]);

  // ─── Sync placements/conditions/artwork to URL hash (no history pollution) ───
  // Only WRITE the hash when state has real content. Never auto-clear it —
  // doing so would race the restore-on-mount effect (which fires earlier in
  // the same effect cycle but its setState calls haven't flushed yet) and
  // would wipe the very hash we're trying to restore from.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasContent = placements.length > 0 || conditions.size > 0 || artwork !== DEFAULT_ARTWORK;
    if (!hasContent) return;
    const encoded = encodeQuoteState({ placements, conditions, artwork });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${QUOTE_HASH_PREFIX}${encoded}`);
  }, [placements, conditions, artwork]);

  // ─── Copy current URL to clipboard so the user can share / save the quote ───
  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch {
      // navigator.clipboard may be unavailable on insecure origins or older
      // browsers — silent fail; the URL is still in the address bar.
    }
  };

  // ─── load fonts + animation styles ───
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideInL { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes scaleIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(245,154,16,0.0); }
        50%      { box-shadow: 0 0 24px 0 rgba(245,154,16,0.35); }
      }
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      @keyframes glossyShift {
        0%, 100% { background-position: 0% 50%; }
        50%      { background-position: 100% 50%; }
      }
      @keyframes glossySweep {
        0%   { transform: translateX(-120%) skewX(-20deg); }
        25%  { transform: translateX(220%)  skewX(-20deg); }
        100% { transform: translateX(220%)  skewX(-20deg); }
      }
      @keyframes glossyGlow {
        0%, 100% { box-shadow:
          0 4px 16px rgba(245,154,16,0.35),
          0 0 0 0 rgba(245,154,16,0),
          inset 0 1px 0 rgba(255,255,255,0.55),
          inset 0 -1px 0 rgba(0,0,0,0.15); }
        50%      { box-shadow:
          0 8px 28px rgba(245,154,16,0.55),
          0 0 22px 4px rgba(245,154,16,0.25),
          inset 0 1px 0 rgba(255,255,255,0.7),
          inset 0 -1px 0 rgba(0,0,0,0.15); }
      }
      @keyframes float    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

      .anim-fadeup    { animation: fadeInUp 0.5s ease-out both; }
      .anim-fadein    { animation: fadeIn 0.4s ease-out both; }
      .anim-slideL    { animation: slideInL 0.5s ease-out both; }
      .anim-scalein   { animation: scaleIn 0.4s ease-out both; }
      .anim-pulse     { animation: pulseGlow 2.6s ease-in-out infinite; }
      .anim-float     { animation: float 4s ease-in-out infinite; }
      .stagger-1 { animation-delay: 0.06s; }
      .stagger-2 { animation-delay: 0.12s; }
      .stagger-3 { animation-delay: 0.18s; }
      .stagger-4 { animation-delay: 0.24s; }
      .stagger-5 { animation-delay: 0.30s; }
      .stagger-6 { animation-delay: 0.36s; }

      .lift { transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease; }
      .lift:hover:not(:disabled) { transform: translateY(-2px); }

      /* Original shimmer-btn (kept for any minor uses) */
      .shimmer-btn {
        background: linear-gradient(135deg, #f0601f 0%, #f59a10 50%, #fad905 100%);
        background-size: 200% 200%;
        animation: shimmer 6s linear infinite;
        transition: transform 0.15s ease, filter 0.2s ease;
      }
      .shimmer-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
      .shimmer-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }

      /* GLOSSY-BTN — premium 3D glass effect with sweeping highlight + glow */
      .glossy-btn {
        position: relative;
        overflow: hidden;
        isolation: isolate;
        background: linear-gradient(135deg, #f0601f 0%, #f59a10 35%, #fad905 70%, #f59a10 100%);
        background-size: 250% 250%;
        animation: glossyShift 7s ease-in-out infinite, glossyGlow 3.2s ease-in-out infinite;
        transition: transform 0.25s cubic-bezier(.2,.9,.3,1.2), filter 0.2s ease, box-shadow 0.2s ease;
        border: 1px solid rgba(255,255,255,0.25);
      }
      /* Glass top-half highlight */
      .glossy-btn::before {
        content: '';
        position: absolute;
        inset: 0 0 50% 0;
        background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 100%);
        pointer-events: none;
        z-index: 1;
        border-radius: inherit;
      }
      /* Sweeping diagonal shine */
      .glossy-btn::after {
        content: '';
        position: absolute;
        top: -10%;
        left: 0;
        height: 120%;
        width: 35%;
        background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.0) 30%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.0) 70%, transparent 100%);
        animation: glossySweep 5.5s cubic-bezier(.5,.1,.3,1) infinite;
        pointer-events: none;
        z-index: 2;
        mix-blend-mode: overlay;
      }
      .glossy-btn > * { position: relative; z-index: 3; }
      .glossy-btn:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.01);
        filter: brightness(1.08) saturate(1.05);
      }
      .glossy-btn:active:not(:disabled) {
        transform: translateY(0) scale(0.985);
        filter: brightness(0.96);
      }

      html, body { overflow-x: hidden; }
      .placement-handle { cursor: grab; }
      .placement-handle:active { cursor: grabbing; }
    `;
    document.head.appendChild(style);
    return () => {
      try { document.head.removeChild(link); } catch (e) {}
      try { document.head.removeChild(style); } catch (e) {}
    };
  }, []);

  const handlePhotoFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP)'); return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoDataUrl(e.target.result);
      setPhotoMime(file.type);
      setPlacements([]);
      setSelectedId(null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  // ─── placement operations ───
  const addPlacement = (template, atX = 0.5, atY = 0.5) => {
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const aspect = template.aspect || 1;

    // Default width as fraction of canvas width. For tall-aspect signs (feather
    // flag, pylon) on a landscape photo, 0.30 spawns a placement taller than
    // the canvas itself — on phones the user then can't drag the resize handle
    // back into view. Read the actual canvas size and clamp w so the spawn is
    // at most 80% of canvas height.
    const canvas = document.querySelector('[data-mockup-canvas]');
    const rect = canvas?.getBoundingClientRect();
    let w = 0.30;
    if (rect && rect.width > 0 && rect.height > 0) {
      const maxWForHeight = (rect.height * 0.8) / (rect.width * aspect);
      w = Math.min(w, maxWForHeight);
    } else {
      // Fallback heuristic when canvas isn't yet rendered: assume 16:9 landscape
      w = Math.min(w, 0.85 / (aspect * 1.78));
    }
    w = Math.max(0.08, w); // floor — never spawn smaller than 8% canvas width

    // Compute placement height as fraction of canvas height for accurate y-clamp
    const hFrac = rect
      ? (w * rect.width * aspect) / rect.height
      : Math.min(0.9, w * aspect);

    const newP = {
      id, templateId: template.id,
      x: Math.max(0, Math.min(1 - w, atX - w/2)),
      y: Math.max(0, Math.min(1 - hFrac, atY - hFrac/2)),
      w,
      rotation: template.defaultRotation || 0,
      text: template.defaultText,
      size: DEFAULT_SIZE_ID,
      primaryOverride: '',
      secondaryOverride: ''
    };
    setPlacements(prev => [...prev, newP]);
    setSelectedId(id);
  };

  const updatePlacement = (id, updates) => {
    setPlacements(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePlacement = (id) => {
    setPlacements(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const reorderPlacement = (id, dir) => {
    setPlacements(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx < 0) return prev;
      const newIdx = dir === 'up' ? Math.min(prev.length - 1, idx + 1) : Math.max(0, idx - 1);
      if (newIdx === idx) return prev;
      const arr = [...prev];
      const [item] = arr.splice(idx, 1);
      arr.splice(newIdx, 0, item);
      return arr;
    });
  };

  // ─── condition toggle ───
  const toggleCondition = (id) => {
    setConditions(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // ─── quote calculation ───
  const calculateQuote = () => {
    const items = placements.map(p => {
      const t = TEMPLATE_LIBRARY.find(x => x.id === p.templateId);
      const sign = SIGN_CATALOGUE[t.sign];
      // Find this placement's size in the sign's own size list,
      // fall back to default ID, then to the first available.
      const sizeInfo = sign.sizes.find(s => s.id === p.size)
                    || sign.sizes.find(s => s.id === DEFAULT_SIZE_ID)
                    || sign.sizes[0];
      const supply  = sizeInfo.flatPrice != null ? sizeInfo.flatPrice : (sign.perSqm * sizeInfo.sqm);
      const install = sign.installBase + (sizeInfo.sqm * sign.installPerSqm);
      const lineTotal = Math.max(supply + install, sign.minTotal);
      return {
        id: p.id, name: sign.name,
        size: sizeInfo.label,
        spec: sizeInfo.spec,
        text: p.text,
        description: sign.description || null,
        supply, install, lineTotal
      };
    });

    const conditionItems = Array.from(conditions).map(id => SITE_CONDITIONS[id]).filter(Boolean);

    const artworkInfo = ARTWORK_OPTIONS[artwork] || ARTWORK_OPTIONS[DEFAULT_ARTWORK];
    const artworkItem = artworkInfo.cost > 0
      ? { line: `Artwork — ${artworkInfo.label}`, cost: artworkInfo.cost, label: artworkInfo.label }
      : null;

    const itemsTotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const conditionsTotal = conditionItems.reduce((s, c) => s + c.cost, 0);
    const artworkTotal = artworkItem ? artworkItem.cost : 0;
    const subtotal = itemsTotal + conditionsTotal + artworkTotal;
    const gst = subtotal * GST_RATE;
    const total = subtotal + gst;

    return { items, conditionItems, artworkItem, artworkInfo, itemsTotal, conditionsTotal, artworkTotal, subtotal, gst, total };
  };

  // ─── compose final image ───
  const exportComposite = () => new Promise((resolve, reject) => {
    if (!photoDataUrl) { resolve(null); return; }
    const img = new Image();
    img.onload = async () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // For each placement, render its SVG to a separate canvas, then drawImage onto main canvas
        for (const p of placements) {
          const t = TEMPLATE_LIBRARY.find(x => x.id === p.templateId);
          if (!t) continue;
          const renderFn = SIGN_RENDERS[t.style];
          if (!renderFn) continue;
          const w = p.w * c.width;
          const h = w * t.aspect;
          const x = p.x * c.width;
          const y = p.y * c.height;
          // Get SVG markup
          const svg = renderFn({
            text: p.text, brand,
            primaryOverride: p.primaryOverride,
            secondaryOverride: p.secondaryOverride
          });
          const svgString = svgElementToString(svg, w, h);
          // Convert SVG to image and draw
          const placementImg = await new Promise((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
          });
          // If the placement is rotated, rotate the canvas around the placement's centre
          const rotation = p.rotation || 0;
          if (rotation !== 0) {
            ctx.save();
            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(placementImg, -w / 2, -h / 2, w, h);
            ctx.restore();
          } else {
            ctx.drawImage(placementImg, x, y, w, h);
          }
        }

        // ─── DISCLAIMER WATERMARK ───
        // Two layers: faint diagonal repeating pattern across the whole image,
        // plus a darker bottom banner with the full disclaimer text.
        drawDisclaimerWatermark(ctx, c.width, c.height);

        resolve(c.toDataURL('image/jpeg', 0.92));
      } catch (e) { reject(e); }
    };
    img.onerror = reject;
    img.src = photoDataUrl;
  });

  // serialise React SVG element to a standalone svg string for rendering off-DOM
  const svgElementToString = (jsx, w, h) => {
    // jsx is a React element returned by a SIGN_RENDERS function (an <svg ...> element)
    // We need to: (a) preserve viewBox + content, (b) embed font import for Anton/Outfit
    const props = jsx.props || {};
    const viewBox = props.viewBox || '0 0 200 100';
    const childrenString = renderJsxChildren(props.children);
    const fontImport = `<defs><style>@import url('https://fonts.googleapis.com/css2?family=Anton&amp;family=Bebas+Neue&amp;family=Outfit:wght@400;700;800;900&amp;display=swap');</style></defs>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet">${fontImport}${childrenString}</svg>`;
  };

  // Manually walk JSX children and serialise (limited but covers our SVG primitives)
  const renderJsxChildren = (children) => {
    if (children == null || children === false) return '';
    if (typeof children === 'string' || typeof children === 'number') return String(children).replace(/[<>&]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]));
    if (Array.isArray(children)) return children.map(renderJsxChildren).join('');
    if (children.type) {
      const tag = typeof children.type === 'string' ? children.type : null;
      if (!tag) return '';
      const props = children.props || {};
      const attrs = Object.keys(props)
        .filter(k => k !== 'children')
        .map(k => {
          const dom = camelToKebab(k);
          const val = props[k];
          if (val == null || val === false) return '';
          return `${dom}="${String(val).replace(/"/g, '&quot;')}"`;
        })
        .filter(Boolean)
        .join(' ');
      const inner = renderJsxChildren(props.children);
      return `<${tag}${attrs ? ' ' + attrs : ''}>${inner}</${tag}>`;
    }
    return '';
  };

  const camelToKebab = (s) => {
    // SVG attributes: most camelCase props go to kebab-case (e.g. strokeWidth → stroke-width)
    // but a few SVG props use camelCase as their attribute name (preserveAspectRatio, viewBox, textAnchor, etc.)
    // simplest: convert camel→kebab except known camelCase SVG attrs
    const camelKept = new Set(['viewBox', 'preserveAspectRatio', 'textAnchor', 'fontSize', 'fontFamily', 'fontWeight', 'letterSpacing', 'strokeWidth', 'floodOpacity', 'stopColor', 'stopOpacity']);
    if (camelKept.has(s)) {
      // SVG attribute names: textAnchor → text-anchor (yes, kebab in DOM)
      // Actually SVG REST attributes are kebab-case. font-size, font-family, text-anchor, stroke-width.
      // But some are kept camelCase: viewBox, preserveAspectRatio.
      const kebabAlways = new Set(['textAnchor', 'fontSize', 'fontFamily', 'fontWeight', 'letterSpacing', 'strokeWidth', 'floodOpacity', 'stopColor', 'stopOpacity']);
      if (kebabAlways.has(s)) return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
      return s; // viewBox, preserveAspectRatio stay as-is
    }
    return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  };

  const fmt = (n) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const onGenerate = async () => {
    if (!photoDataUrl) { setError('Upload a site photo first'); return; }
    if (placements.length === 0) { setError('Add at least one sign to your photo'); return; }
    setGenerating(true);
    setError(null);
    try {
      const composite = await exportComposite();
      const quote = calculateQuote();
      setResult({ composite, quote });
      setSelectedId(null);
      // Stage 3 takes the place of Stage 2 in the same scroll position, so the
      // user lands halfway down the new view (over the breakdown) instead of at
      // the mockup. Jump to the top so they see the rendered mockup first.
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to compose mockup: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const fullReset = () => {
    setPhotoDataUrl(null); setPhotoMime('image/jpeg');
    setPlacements([]); setSelectedId(null);
    setConditions(new Set());
    setArtwork(DEFAULT_ARTWORK);
    setResult(null); setError(null);
    // Clear the saved-quote hash so the next visit starts fresh.
    if (typeof window !== 'undefined' && window.location.hash.startsWith(QUOTE_HASH_PREFIX)) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      minHeight: '100vh',
      color: BRAND.textPri,
      position: 'relative',
      overflow: 'hidden',
      background: `
        radial-gradient(ellipse 1100px 700px at 50% -100px, rgba(245, 154, 16, 0.10), transparent 55%),
        radial-gradient(ellipse 900px 700px at 100% 100%, rgba(1, 38, 89, 0.55), transparent 60%),
        radial-gradient(ellipse 700px 600px at 0% 80%, rgba(13, 28, 70, 0.4), transparent 60%),
        linear-gradient(160deg, #0e2046 0%, #0a1832 45%, #050d22 100%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10" style={{ zIndex: 2 }}>
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8 sm:mb-12 pb-5 sm:pb-6 anim-fadein"
          style={{ borderBottom: `1px solid ${BRAND.navyLine}` }}>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link to="/" title="Back to Strike Print home" className="flex-shrink-0 lift">
              <img src={LOGO_URL} alt="Strike Print"
                className="h-16 sm:h-24 w-auto object-contain anim-slideL -mt-2 cursor-pointer"
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} />
            </Link>
            <div className="min-w-0 anim-slideL stagger-1 hidden sm:block">
              <div style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.05em' }}
                className="text-sm sm:text-lg uppercase tracking-widest truncate" >
                <span style={{ color: BRAND.textMuted }}>QUOTE </span>
                <span style={{ color: BRAND.textPri }}>ESTIMATOR</span>
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1 truncate hidden sm:block">
                Online Quote and Mock-up Estimator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {(photoDataUrl || result) && (
              <button onClick={fullReset}
                className="text-xs uppercase tracking-widest hover:text-amber-400 transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
                ↺ NEW
              </button>
            )}
          </div>
        </header>

        {/* STAGE INDICATOR */}
        <StageIndicator stages={[
          {
            n: '01', label: 'PHOTO', short: 'PIC',
            active: !photoDataUrl,
            enabled: true,
            onClick: () => {
              if (!photoDataUrl) return;  // already there
              setPhotoDataUrl(null);
              setPlacements([]);
              setSelectedId(null);
              setResult(null);
            }
          },
          {
            n: '02', label: 'COMPOSE', short: 'EDIT',
            active: photoDataUrl && !result,
            enabled: !!photoDataUrl,
            onClick: photoDataUrl ? (() => { if (result) setResult(null); }) : undefined
          },
          {
            n: '03', label: 'QUOTE', short: 'OUT',
            active: !!result,
            enabled: !!result,
            onClick: result ? (() => {}) : undefined
          }
        ]} />

        {/* STAGE 1: PHOTO UPLOAD */}
        {!photoDataUrl && (
          <div className="max-w-3xl mx-auto anim-fadeup">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <SectionHeader num="01" title="Upload Site Photo" />
              <button onClick={() => setShowHowTo(true)}
                className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] hover:text-amber-400 transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
                · how it works
              </button>
            </div>
            <p className="text-sm mt-4 mb-6 leading-relaxed" style={{ color: BRAND.textMuted }}>
              Upload a clear photo of the storefront, building, vehicle, or interior where the signage will go. You'll add signs onto it next.
            </p>

            {/* Hidden inputs — one for picking from gallery (no capture attr,
                so the system picker offers both gallery and camera on phones),
                and one dedicated camera input for the explicit 'Take Photo'
                shortcut below the drop-zone. */}
            <input ref={photoInputRef} type="file" accept="image/*"
              onChange={(e) => handlePhotoFile(e.target.files[0])}
              style={{
                position: 'absolute', width: 1, height: 1,
                padding: 0, margin: -1, overflow: 'hidden',
                clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
              }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
              onChange={(e) => handlePhotoFile(e.target.files[0])}
              style={{
                position: 'absolute', width: 1, height: 1,
                padding: 0, margin: -1, overflow: 'hidden',
                clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0
              }} />

            <button type="button"
              onClick={() => photoInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handlePhotoFile(e.dataTransfer.files[0]); }}
              className="relative cursor-pointer lift anim-fadeup stagger-2 block w-full"
              style={{
                aspectRatio: '4/3',
                background: dragOver ? `${BRAND.boltAmber}10` : 'rgba(15,32,70,0.6)',
                border: `2px dashed ${dragOver ? BRAND.boltAmber : BRAND.navyLineStrong}`,
                backdropFilter: 'blur(8px)',
                color: BRAND.textPri
              }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center pointer-events-none">
                <div className="anim-float">
                  <ImageIcon className="w-12 h-12" style={{ color: BRAND.textFaint }} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: BRAND.textPri }}>Drop a site photo or click to upload</p>
                  <p className="text-[10px] mt-1 uppercase tracking-widest"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
                    JPG · PNG · WEBP
                  </p>
                </div>
              </div>
              <CornerBrackets />
            </button>

            {/* Camera shortcut — opens the rear camera directly. Useful when
                you're on-site and want to capture rather than browse a gallery. */}
            <div className="mt-3 flex items-center gap-3 anim-fadeup stagger-3">
              <span className="flex-1 h-px" style={{ background: BRAND.navyLine }} />
              <span className="text-[10px] uppercase tracking-[0.25em]"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
                or
              </span>
              <span className="flex-1 h-px" style={{ background: BRAND.navyLine }} />
            </div>
            <button type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="lift mt-3 anim-fadeup stagger-3 w-full inline-flex items-center justify-center gap-3 px-4 py-3.5"
              style={{
                background: 'rgba(8,21,46,0.6)',
                border: `1px solid ${BRAND.navyLineStrong}`,
                color: BRAND.textPri,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.18em',
                fontSize: '11px',
                textTransform: 'uppercase'
              }}>
              <Camera className="w-4 h-4" style={{ color: BRAND.boltAmber }} strokeWidth={2} />
              Take a Photo with Your Camera
            </button>

            {error && <ErrorBox msg={error} />}
          </div>
        )}

        {/* STAGE 2: COMPOSE */}
        {photoDataUrl && !result && (
          <CompositionStage
            photoDataUrl={photoDataUrl}
            placements={placements}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            updatePlacement={updatePlacement}
            removePlacement={removePlacement}
            reorderPlacement={reorderPlacement}
            addPlacement={addPlacement}
            brand={brand}
            conditions={conditions}
            toggleCondition={toggleCondition}
            artwork={artwork}
            setArtwork={setArtwork}
            onGenerate={onGenerate}
            onShare={onShare}
            shareCopied={shareCopied}
            onResetPhoto={() => { setPhotoDataUrl(null); setPlacements([]); setSelectedId(null); }}
            generating={generating}
            error={error}
          />
        )}

        {/* STAGE 3: QUOTE */}
        {result && (
          <QuoteResult
            result={result}
            originalPhoto={photoDataUrl}
            conditions={conditions}
            onBack={() => setResult(null)}
            onNew={fullReset}
            onShare={onShare}
            shareCopied={shareCopied}
            fmt={fmt}
          />
        )}

        <footer className="mt-16 sm:mt-20 pt-5 sm:pt-6 flex flex-col sm:flex-row justify-between gap-3 text-[10px] uppercase tracking-widest"
          style={{ borderTop: `1px solid ${BRAND.navyLine}`, fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Strike Print" className="h-6 w-auto opacity-50" />
            <span>STRIKE PRINT · QUOTE ENGINE v0.8</span>
          </div>
          <span className="truncate">DRAG · DROP · POSITION</span>
        </footer>
      </div>

      {/* HOW IT WORKS modal — first-visit walkthrough on Stage 1 */}
      {showHowTo && <HowItWorksModal onClose={dismissHowTo} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//   COMPOSITION STAGE — the editor
// ═══════════════════════════════════════════════════════════════
function CompositionStage({
  photoDataUrl, placements, selectedId, setSelectedId,
  updatePlacement, removePlacement, reorderPlacement, addPlacement,
  brand, conditions, toggleCondition, artwork, setArtwork,
  onGenerate, onShare, shareCopied, onResetPhoto, generating, error
}) {
  const selected = placements.find(p => p.id === selectedId);

  return (
    <div className="space-y-8">
      <div className="anim-fadeup">
        <SectionHeader num="02" title="Compose Your Mockup" />
        <p className="text-sm mt-4 leading-relaxed" style={{ color: BRAND.textMuted }}>
          Click a sign from the panel to add it. Drag to position, drag the corner to resize, drag the top handle to rotate.
        </p>
        <p className="text-xs mt-3 leading-relaxed px-3 py-2"
          style={{
            color: BRAND.boltAmber,
            background: `${BRAND.boltAmber}10`,
            border: `1px solid ${BRAND.boltAmber}40`,
            fontFamily: "'JetBrains Mono', monospace"
          }}>
          <strong>Note:</strong> this is a general indicator for layout and ideas only — a more complete mockup will be produced after quote completed.
        </p>
      </div>

      <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-4 items-start">
        {/*
          Templates panel.
          Mobile: stacks UNDER the photo (flex-col-reverse on parent), full width,
                  2-3 column grid so the names are actually readable.
          Desktop (≥1024px): pinned sidebar on the left, vertical list, sticky.
        */}
        <aside className="anim-slideL w-full lg:w-[260px] lg:flex-shrink-0">
          <div className="lg:sticky lg:top-4">
            {/* Sidebar header */}
            <div className="flex items-center justify-between gap-1 mb-2 lg:mb-3 px-3 py-2"
              style={{
                background: 'rgba(8,21,46,0.85)',
                border: `1px solid ${BRAND.navyLineStrong}`,
                borderBottom: `2px solid ${BRAND.boltAmber}`,
                backdropFilter: 'blur(12px)'
              }}>
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BRAND.boltAmber }} strokeWidth={2} />
                <span className="text-[10px] uppercase tracking-[0.25em] truncate"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  Signs
                </span>
              </div>
              <span className="text-[10px] flex-shrink-0"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
                {TEMPLATE_LIBRARY.length}
              </span>
            </div>

            {/*
              Layout container.
              Mobile: 2-col grid (3-col at sm:≥640px) for readable thumbs.
              Desktop: vertical flex, scrollable, sticky-pinned to viewport.
            */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:flex lg:flex-col lg:gap-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${BRAND.navyLineStrong} transparent`
              }}>
              {TEMPLATE_LIBRARY.map(t => (
                <TemplateThumb key={t.id} template={t} brand={brand} onAdd={() => addPlacement(t)} />
              ))}
            </div>

            {/* Sidebar footer hint — desktop only */}
            <div className="hidden lg:block mt-3 px-3 py-2 text-[10px] leading-relaxed"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: 'rgba(15,32,70,0.4)',
                border: `1px dashed ${BRAND.navyLine}`,
                color: BRAND.textDim
              }}>
              Click to add → drag to position → corner handle to resize
            </div>
          </div>
        </aside>

        {/* Photo canvas + controls (right on desktop, top on mobile) */}
        <div className="space-y-4 flex-1 min-w-0 w-full">
          <PhotoCanvas
            src={photoDataUrl}
            placements={placements}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            updatePlacement={updatePlacement}
            removePlacement={removePlacement}
            brand={brand}
          />

          {/* Selection controls */}
          {selected ? (
            <SelectionPanel
              placement={selected}
              brand={brand}
              onUpdate={(u) => updatePlacement(selected.id, u)}
              onDelete={() => removePlacement(selected.id)}
              onReorder={(dir) => reorderPlacement(selected.id, dir)}
            />
          ) : (
            <div className="p-4 text-center text-xs uppercase tracking-widest"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: 'rgba(15,32,70,0.4)',
                border: `1px dashed ${BRAND.navyLine}`,
                color: BRAND.textDim
              }}>
              {placements.length === 0
                ? 'Click a sign to add it to the photo'
                : 'Click a placed sign to edit it'}
            </div>
          )}
        </div>
      </div>

      {/* Artwork / design */}
      <div className="anim-fadeup">
        <SectionHeader num="03" title="Artwork &amp; Design" />
        <p className="text-sm mt-4 mb-4 leading-relaxed" style={{ color: BRAND.textMuted }}>
          Are you supplying print-ready artwork, or do you need our team to design it?
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          {Object.entries(ARTWORK_OPTIONS).map(([id, opt]) => {
            const active = artwork === id;
            return (
              <button key={id} onClick={() => setArtwork(id)}
                className="text-left p-4 lift"
                style={{
                  background: active ? `${BRAND.boltAmber}15` : 'rgba(15,32,70,0.6)',
                  border: `1px solid ${active ? BRAND.boltAmber : BRAND.navyLine}`,
                  backdropFilter: 'blur(8px)'
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center"
                    style={{
                      border: `1.5px solid ${active ? BRAND.boltAmber : BRAND.navyLineStrong}`,
                      background: active ? BRAND.boltAmber : 'transparent'
                    }}>
                    {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND.navy }} />}
                  </div>
                  <span className="text-sm font-semibold flex-1 truncate" style={{ color: active ? BRAND.textPri : '#cbd5e1' }}>
                    {opt.label}
                  </span>
                  <span className="text-[11px] whitespace-nowrap flex-shrink-0"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: active ? BRAND.boltAmber : BRAND.textDim }}>
                    {opt.cost === 0 ? 'FREE' : `+$${opt.cost}`}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed pl-6" style={{ color: BRAND.textDim }}>{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onGenerate} disabled={generating || placements.length === 0}
        className={`group w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${placements.length > 0 && !generating ? 'glossy-btn' : ''}`}
        style={{
          background: placements.length === 0 || generating ? BRAND.boltAmber : undefined,
          color: BRAND.navy,
          fontFamily: 'Anton, sans-serif',
          letterSpacing: '0.1em'
        }}>
        <span className="flex items-center gap-3">
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
          <span className="text-base sm:text-xl">{generating ? 'COMPOSING…' : 'GENERATE QUOTE'}</span>
        </span>
        {!generating && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
      </button>

      {/* Save / share — copies URL to clipboard. URL hash carries the quote state. */}
      {onShare && (
        <button onClick={onShare}
          className="lift w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(8,21,46,0.6)',
            border: `1px solid ${BRAND.navyLineStrong}`,
            color: shareCopied ? BRAND.boltAmber : BRAND.textMuted
          }}>
          {shareCopied ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Link2 className="w-3.5 h-3.5" strokeWidth={2} />}
          {shareCopied ? 'Link copied to clipboard' : 'Copy quote link · save for later or share'}
        </button>
      )}

      {error && <ErrorBox msg={error} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//   PHOTO CANVAS — the photo with placements rendered as draggable HTML elements
// ═══════════════════════════════════════════════════════════════
function PhotoCanvas({ src, placements, selectedId, setSelectedId, updatePlacement, removePlacement, brand }) {
  const wrapRef = useRef(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const dragRef = useRef(null);
  // Mirror props in refs so the global pointer listener (attached once on mount)
  // always reads the freshest values without needing to re-attach on every render.
  const placementsRef = useRef(placements);
  const updateRef = useRef(updatePlacement);
  useEffect(() => { placementsRef.current = placements; }, [placements]);
  useEffect(() => { updateRef.current = updatePlacement; }, [updatePlacement]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  const getRect = () => wrapRef.current?.getBoundingClientRect();

  const onPointerDown = (e, p, mode) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(p.id);
    const rect = getRect();
    if (!rect) return;
    const evt = e.touches ? e.touches[0] : e;

    // For rotate mode: compute placement center + initial angle
    let centerX = 0, centerY = 0, startAngle = 0;
    if (mode === 'rotate') {
      const t = TEMPLATE_LIBRARY.find(x => x.id === p.templateId);
      const placementWPx = p.w * rect.width;
      const placementHPx = placementWPx * (t ? t.aspect : 1);
      centerX = rect.left + (p.x + p.w / 2) * rect.width;
      centerY = rect.top + p.y * rect.height + placementHPx / 2;
      startAngle = Math.atan2(evt.clientY - centerY, evt.clientX - centerX);
    }

    dragRef.current = {
      mode,
      placementId: p.id,
      startMouseX: evt.clientX,
      startMouseY: evt.clientY,
      startX: p.x, startY: p.y, startW: p.w,
      startRotation: p.rotation || 0,
      centerX, centerY, startAngle,
      rect
    };
    // Note: pointer capture intentionally NOT called — window listeners pick up
    // all subsequent events, and capture can behave oddly with CSS transforms.
  };

  // Attach pointer listeners ONCE on mount. Closure reads latest data via refs.
  useEffect(() => {
    const handleMove = (e) => {
      if (!dragRef.current) return;
      const evt = e.touches ? e.touches[0] : e;
      const { mode, placementId, startMouseX, startMouseY, startX, startY, startW, startRotation, centerX, centerY, startAngle, rect } = dragRef.current;
      const dx = (evt.clientX - startMouseX) / rect.width;
      const dy = (evt.clientY - startMouseY) / rect.height;
      const p = placementsRef.current.find(x => x.id === placementId);
      if (!p) return;
      const t = TEMPLATE_LIBRARY.find(x => x.id === p.templateId);
      if (mode === 'move') {
        const nx = Math.max(0, Math.min(1 - startW, startX + dx));
        const h = startW * t.aspect * (rect.width / rect.height);
        const ny = Math.max(0, Math.min(1 - h, startY + dy));
        updateRef.current(placementId, { x: nx, y: ny });
      } else if (mode === 'resize') {
        const nw = Math.max(0.05, Math.min(1 - startX, startW + dx));
        updateRef.current(placementId, { w: nw });
      } else if (mode === 'rotate') {
        const currentAngle = Math.atan2(evt.clientY - centerY, evt.clientX - centerX);
        const deltaDeg = (currentAngle - startAngle) * 180 / Math.PI;
        let newRot = (startRotation + deltaDeg) % 360;
        if (newRot < 0) newRot += 360;
        if (e.shiftKey) {
          const snap = 15;
          const nearest = Math.round(newRot / snap) * snap;
          if (Math.abs(newRot - nearest) < 5) newRot = nearest % 360;
        }
        updateRef.current(placementId, { rotation: newRot });
      }
      // Only block default for touch (prevents page scroll). pointermove preventDefault
      // can interfere with focus / capture mechanics.
      if (e.touches) e.preventDefault();
    };
    const handleUp = () => { dragRef.current = null; };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, []); // attach once

  return (
    <div ref={wrapRef} data-mockup-canvas className="relative anim-fadeup"
      onClick={(e) => { if (e.target === wrapRef.current) setSelectedId(null); }}
      style={{ background: 'rgba(15,32,70,0.6)', border: `1px solid ${BRAND.navyLineStrong}`, touchAction: 'none' }}>
      <img src={src} alt="site" className="w-full block"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        onClick={() => setSelectedId(null)} draggable={false} />

      {placements.map((p, idx) => {
        const t = TEMPLATE_LIBRARY.find(x => x.id === p.templateId);
        if (!t) return null;
        const renderFn = SIGN_RENDERS[t.style];
        const rect = getRect();
        // height as fraction of canvas height (depends on canvas aspect)
        const heightInPx = rect ? p.w * rect.width * t.aspect : 0;
        const heightFrac = rect ? heightInPx / rect.height : p.w * t.aspect;
        const isSelected = p.id === selectedId;
        return (
          <div
            key={p.id}
            onPointerDown={(e) => onPointerDown(e, p, 'move')}
            className="placement-handle anim-scalein"
            style={{
              position: 'absolute',
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              width: `${p.w * 100}%`,
              aspectRatio: `1 / ${t.aspect}`,
              border: isSelected ? `2px solid ${BRAND.boltAmber}` : '2px solid transparent',
              boxShadow: isSelected ? `0 0 0 1px ${BRAND.navyDeep}, 0 0 24px rgba(245,154,16,0.3)` : 'none',
              transform: `rotate(${p.rotation || 0}deg)`,
              transformOrigin: '50% 50%',
              zIndex: idx + 10
            }}>
            {renderFn && renderFn({
              text: p.text, brand,
              primaryOverride: p.primaryOverride,
              secondaryOverride: p.secondaryOverride
            })}

            {/* Handles — positions computed so they appear at visual top/right/corners
                regardless of the placement's rotation. The handles are still inside the
                rotating div, so we offset them in local coords using the inverse rotation,
                then counter-rotate the icons to keep them upright on screen. */}
            {isSelected && (() => {
              const rot = p.rotation || 0;
              const rRad = rot * Math.PI / 180;
              const sR = Math.sin(rRad);
              const cR = Math.cos(rRad);

              // Helper: convert a desired SCREEN offset (sx, sy) from placement centre
              // into the LOCAL (pre-rotation) offset that, after CSS rotation, lands there.
              // CSS rotate is CW with Y down: (lx, ly) → (lx*cos - ly*sin, lx*sin + ly*cos)
              // Inverse: lx = sx*cos + sy*sin, ly = -sx*sin + sy*cos
              const toLocal = (sx, sy) => ({
                lx: sx * cR + sy * sR,
                ly: -sx * sR + sy * cR
              });

              // Rotate handle: 42px above visual centre (screen offset (0, -42))
              const ROT = toLocal(0, -42);

              // Resize handle: pick whichever ORIGINAL corner ends up closest to the
              // visual bottom-right after rotation. Discrete switching at 45° boundaries.
              const norm = ((rot % 360) + 360) % 360;
              let resizeStyle;
              if (norm < 45 || norm >= 315)      resizeStyle = { right: -10, bottom: -10 };  // BR
              else if (norm < 135)               resizeStyle = { right: -10, top: -10 };     // TR
              else if (norm < 225)               resizeStyle = { left: -10,  top: -10 };     // TL
              else                                resizeStyle = { left: -10,  bottom: -10 };  // BL

              // Delete button: at visual top-right of placement (always opposite of resize).
              // For 0° rot: top-right. For 90° rot: needs to land at original BR (so it
              // visually appears top-right after rotation). Use same quadrant logic but
              // rotated 90° from resize.
              let deleteStyle;
              if (norm < 45 || norm >= 315)      deleteStyle = { right: -10, top: -10 };     // TR
              else if (norm < 135)               deleteStyle = { left: -10, top: -10 };      // TL
              else if (norm < 225)               deleteStyle = { left: -10, bottom: -10 };   // BL
              else                                deleteStyle = { right: -10, bottom: -10 };  // BR

              return (
                <>
                  {/* Connector line from placement edge toward rotate handle.
                      Spans roughly half the handle distance, centred between centre and handle. */}
                  <div style={{
                    position: 'absolute',
                    left: `calc(50% + ${ROT.lx * 0.55}px)`,
                    top:  `calc(50% + ${ROT.ly * 0.55}px)`,
                    width: 2, height: 22,
                    background: BRAND.boltAmber,
                    transform: `translate(-50%, -50%) rotate(${-rot}deg)`,
                    pointerEvents: 'none',
                    zIndex: 5
                  }} />

                  {/* Rotate handle */}
                  <div
                    onPointerDown={(e) => onPointerDown(e, p, 'rotate')}
                    title="Drag to rotate · hold Shift to snap to 15°"
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${ROT.lx}px)`,
                      top:  `calc(50% + ${ROT.ly}px)`,
                      width: 24, height: 24,
                      background: BRAND.boltAmber,
                      cursor: 'grab',
                      border: `2px solid ${BRAND.navyDeep}`,
                      borderRadius: '50%',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      touchAction: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: BRAND.navyDeep,
                      transform: `translate(-50%, -50%) rotate(${-rot}deg)`,
                      zIndex: 6
                    }}>
                    <RotateCw size={12} strokeWidth={3} />
                  </div>

                  {/* Resize handle */}
                  <div onPointerDown={(e) => onPointerDown(e, p, 'resize')}
                    style={{
                      position: 'absolute',
                      ...resizeStyle,
                      width: 20, height: 20,
                      background: BRAND.boltAmber,
                      cursor: 'nwse-resize',
                      border: `2px solid ${BRAND.navyDeep}`,
                      touchAction: 'none',
                      zIndex: 5
                    }} />

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removePlacement(p.id); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title="Remove sign"
                    style={{
                      position: 'absolute',
                      ...deleteStyle,
                      width: 22, height: 22,
                      background: '#dc2626',
                      color: '#ffffff',
                      cursor: 'pointer',
                      border: `2px solid ${BRAND.navyDeep}`,
                      borderRadius: '50%',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transform: `rotate(${-rot}deg)`,  // keep ✕ upright
                      zIndex: 7,
                      touchAction: 'none'
                    }}>
                    <X size={12} strokeWidth={3} />
                  </button>
                </>
              );
            })()}
          </div>
        );
      })}

      <CornerBrackets />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//   TEMPLATE THUMB — sidebar item, click to add to canvas
// ═══════════════════════════════════════════════════════════════
function TemplateThumb({ template, brand, onAdd }) {
  const renderFn = SIGN_RENDERS[template.style];
  return (
    <button onClick={onAdd}
      title={template.name}
      className="lift p-2 flex items-center gap-2 text-left w-full"
      style={{ background: 'rgba(15,32,70,0.6)', border: `1px solid ${BRAND.navyLine}`, backdropFilter: 'blur(8px)' }}>
      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(8,21,46,0.6)', border: `1px solid ${BRAND.navyLineStrong}` }}>
        <div style={{ width: '85%', height: '85%' }}>
          {renderFn && renderFn({ text: template.defaultText, brand })}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold leading-tight truncate" style={{ color: BRAND.textPri }}>{template.name}</div>
        <div className="text-[10px] uppercase tracking-widest mt-0.5"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
          <Plus className="w-2.5 h-2.5 inline" /> ADD
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//   SELECTION PANEL — controls for the currently-selected placement
// ═══════════════════════════════════════════════════════════════
function SelectionPanel({ placement, brand, onUpdate, onDelete, onReorder }) {
  const t = TEMPLATE_LIBRARY.find(x => x.id === placement.templateId);
  if (!t) return null;
  const sign = SIGN_CATALOGUE[t.sign];

  return (
    <div className="p-4 anim-scalein space-y-3"
      style={{ background: 'rgba(15,32,70,0.7)', border: `1px solid ${BRAND.boltAmber}50`, backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-[0.3em] flex-shrink-0"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>SELECTED</span>
        <span style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.04em' }} className="text-base sm:text-lg">{t.name}</span>
        <span className="text-[10px] uppercase tracking-widest"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>· {sign.name}</span>
      </div>

      <div>
        <Label num="·" text="Size (for quote)" icon={Maximize2} />
        <div className="grid grid-cols-4 gap-1 mt-2">
          {(sign.sizes || []).map(sz => {
            const active = (placement.size || DEFAULT_SIZE_ID) === sz.id;
            return (
              <button key={sz.id} onClick={() => onUpdate({ size: sz.id })}
                title={sz.spec}
                className="px-1 py-2 transition-all text-center"
                style={{
                  background: active ? `${BRAND.boltAmber}20` : BRAND.navyRaise,
                  border: `1px solid ${active ? BRAND.boltAmber : BRAND.navyLineStrong}`
                }}>
                <div className="text-[11px] font-semibold" style={{ color: active ? BRAND.boltAmber : '#cbd5e1' }}>{sz.label}</div>
                <div className="text-[9px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>{sz.spec}</div>
              </button>
            );
          })}
        </div>
        {sign.description && (
          <div className="mt-3 px-3 py-2 text-[11px] leading-relaxed" style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(245,154,16,0.08)',
            borderLeft: `2px solid ${BRAND.boltAmber}`,
            color: BRAND.textPri
          }}>
            {sign.description}
          </div>
        )}
      </div>
    </div>
  );
}

function ColourSwatchInput({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 px-2 py-1 cursor-pointer"
      style={{ background: BRAND.navyRaise, border: `1px solid ${BRAND.navyLineStrong}` }}>
      <div className="w-6 h-6 flex-shrink-0" style={{ background: value, border: '1px solid rgba(255,255,255,0.1)' }} />
      <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="absolute opacity-0 w-0 h-0" />
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════
//   QUOTE RESULT
// ═══════════════════════════════════════════════════════════════
function QuoteResult({ result, originalPhoto, conditions, onBack, onNew, onShare, shareCopied, fmt }) {
  return (
    <div className="anim-fadeup">
      <SectionHeader num="04" title="Mockup &amp; Quote" big />

      <div className="mt-6 sm:mt-8 relative">
        <div className="absolute top-3 left-3 z-10 px-2 py-1 text-[10px] uppercase tracking-widest font-bold" style={{
          fontFamily: "'JetBrains Mono', monospace", background: BRAND.boltGrad, color: BRAND.navy
        }}>MOCKUP</div>
        {result.composite ? (
          // Show the WHOLE mockup (object-contain), capped at 70vh so it doesn't dominate
          // the page on tall portrait photos. Letterboxes onto navy background if needed.
          <img src={result.composite} alt="mockup" className="block w-full mx-auto"
            style={{
              border: `1px solid ${BRAND.boltAmber}`,
              maxHeight: '70vh',
              objectFit: 'contain',
              background: BRAND.navyDeep
            }} />
        ) : (
          <div className="flex items-center justify-center" style={{ aspectRatio: '16/9', background: BRAND.navyCard }}>
            <span className="text-xs" style={{ color: BRAND.textMuted }}>(composite failed)</span>
          </div>
        )}
        {/* Mockup disclaimer */}
        <p className="mt-2 text-[11px] italic leading-relaxed" style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: BRAND.textDim
        }}>
          Note: this is a general indicator for layout and ideas only — a more complete mockup will be produced after quote completed.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6 mt-6 sm:mt-8">
        <div className="lg:col-span-3 space-y-3">
          <Label num="D" text="Quote Breakdown" />
          <div style={{ background: 'rgba(15,32,70,0.7)', border: `1px solid ${BRAND.navyLineStrong}`, backdropFilter: 'blur(12px)' }}>
            <div className="p-4 sm:p-5 space-y-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: BRAND.textDim }}>Signs</div>
              {result.quote.items.map(item => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between items-baseline gap-3">
                    <div className="min-w-0">
                      <div className="text-sm truncate" style={{ color: BRAND.textPri, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>{item.name}</div>
                      <div className="text-[10px] uppercase tracking-widest truncate" style={{ color: BRAND.textDim }}>{item.size} · {item.spec} · "{item.text}"</div>
                    </div>
                    <span className="text-sm whitespace-nowrap flex-shrink-0" style={{ color: BRAND.textPri, fontWeight: 600 }}>{fmt(item.lineTotal)}</span>
                  </div>
                  {item.description && (
                    <div className="text-[10px] italic" style={{ color: BRAND.boltAmber }}>{item.description}</div>
                  )}
                  <div className="text-[10px] flex justify-between" style={{ color: BRAND.textDim }}>
                    <span>Supply: {fmt(item.supply)}</span>
                    <span>Install: {fmt(item.install)}</span>
                  </div>
                </div>
              ))}

              {result.quote.conditionItems.length > 0 && (
                <>
                  <div className="text-[10px] uppercase tracking-widest pt-3 mt-3" style={{ borderTop: `1px solid ${BRAND.navyLine}`, color: BRAND.textDim }}>Site Conditions</div>
                  {result.quote.conditionItems.map((c, i) => (
                    <div key={i} className="flex justify-between items-baseline">
                      <span className="text-sm" style={{ color: '#cbd5e1', fontFamily: 'Outfit, sans-serif' }}>{c.line}</span>
                      <span className="text-sm whitespace-nowrap" style={{ color: BRAND.textPri }}>{fmt(c.cost)}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Artwork line */}
              <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${BRAND.navyLine}` }}>
                <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: BRAND.textDim }}>Artwork</div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm" style={{ color: '#cbd5e1', fontFamily: 'Outfit, sans-serif' }}>{result.quote.artworkInfo.label}</span>
                  <span className="text-sm whitespace-nowrap" style={{ color: result.quote.artworkTotal > 0 ? BRAND.textPri : BRAND.textDim }}>
                    {result.quote.artworkTotal > 0 ? fmt(result.quote.artworkTotal) : 'Included'}
                  </span>
                </div>
              </div>

              <div className="pt-3 mt-3 space-y-1" style={{ borderTop: `1px solid ${BRAND.navyLine}` }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: BRAND.textDim }}>Subtotal</span>
                  <span style={{ color: BRAND.textMuted }}>{fmt(result.quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: BRAND.textDim }}>GST ({Math.round(GST_RATE * 100)}%)</span>
                  <span style={{ color: BRAND.textMuted }}>{fmt(result.quote.gst)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 anim-pulse" style={{ background: BRAND.boltGrad, color: BRAND.navy }}>
              <div className="text-[10px] uppercase tracking-widest opacity-70 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Total · AUD inc. GST
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.03em', lineHeight: 1, fontSize: 'clamp(2rem, 7vw, 2.75rem)' }}>
                {fmt(result.quote.total)}
              </div>
            </div>

            <div className="px-4 sm:px-5 py-4 flex items-start gap-3"
              style={{
                borderTop: `1px solid ${BRAND.boltAmber}40`,
                background: `linear-gradient(135deg, rgba(245,154,16,0.12), rgba(240,96,31,0.08))`,
                borderLeft: `3px solid ${BRAND.boltAmber}`
              }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BRAND.boltAmber }} strokeWidth={2.5} />
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] mb-1 font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  Indicative Quote Only
                </div>
                <div className="text-[12px] leading-relaxed font-medium"
                  style={{ color: BRAND.textPri }}>
                  Final pricing is subject to <strong style={{ color: BRAND.boltAmber }}>site survey, structural assessment &amp; council approval</strong> where applicable.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-2">
          <Label num="E" text="Actions" />
          {/* Compact icon toolbar */}
          <div className="grid grid-cols-5 gap-1.5"
            style={{ background: 'rgba(15,32,70,0.4)', border: `1px solid ${BRAND.navyLine}`, padding: '6px', backdropFilter: 'blur(8px)' }}>
            <ActionIconButton icon={ChevronRight} flip onClick={onBack} label="Back" />
            <ActionIconButton icon={Download} onClick={() => downloadDataUrl(result.composite, 'mockup.jpg')} disabled={!result.composite} label="Save" />
            <ActionIconButton icon={shareCopied ? Check : Link2} onClick={onShare} label={shareCopied ? 'Copied' : 'Share'} />
            <ActionIconButton icon={Printer} onClick={() => window.print()} label="Print" />
            <ActionIconButton icon={RotateCcw} onClick={onNew} label="New" />
          </div>
        </div>
      </div>

      {/* CONTACT / SEND FORM — supersized hero section */}
      <div className="mt-12 sm:mt-16 relative anim-fadeup">
        {/* Glowing banner backdrop */}
        <div className="absolute -inset-4 sm:-inset-6 pointer-events-none anim-pulse" style={{
          background: `radial-gradient(ellipse 600px 200px at 50% 50%, rgba(245,154,16,0.18), transparent 70%)`,
          filter: 'blur(20px)'
        }} />

        <div className="relative">
          <SectionHeader num="05" title="Send to Strike Print" big />
          <div className="mt-5 mb-6 flex items-start gap-3 anim-fadeup stagger-1">
            <div className="flex-shrink-0 w-1 h-12" style={{ background: BRAND.boltGrad }} />
            <div className="flex-1">
              <p className="text-base leading-relaxed" style={{ color: BRAND.textPri }}>
                Happy with how it looks? <strong style={{ color: BRAND.boltAmber }}>Send the quote to our team</strong> and we'll be in touch.
              </p>
              <p className="text-sm leading-relaxed mt-1" style={{ color: BRAND.textMuted }}>
                Your photo, mockup and quote breakdown all get attached automatically.
              </p>
            </div>
          </div>
          <ContactForm result={result} originalPhoto={originalPhoto} fmt={fmt} />
        </div>
      </div>
    </div>
  );
}

// Compact action icon button used in the actions toolbar
function ActionIconButton({ icon: Icon, onClick, disabled, label, flip }) {
  return (
    <button onClick={onClick} disabled={disabled}
      title={label}
      className="lift flex flex-col items-center justify-center gap-1 py-2.5 px-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: 'rgba(8,21,46,0.6)',
        border: `1px solid ${BRAND.navyLineStrong}`,
        color: BRAND.textPri,
        fontFamily: "'JetBrains Mono', monospace"
      }}>
      <Icon className="w-4 h-4" strokeWidth={2} style={{ transform: flip ? 'scaleX(-1)' : 'none' }} />
      <span className="text-[9px] uppercase tracking-widest">{label}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//   CONTACT FORM — emails the quote + mockup to Strike Print
// ═══════════════════════════════════════════════════════════════
function ContactForm({ result, originalPhoto, fmt }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [statusMsg, setStatusMsg] = useState('');

  const update = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your name';
    if (!form.phone.trim() && !form.email.trim()) return 'Please give us a phone number or email so we can reach you';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'That email doesn\'t look right';
    return null;
  };

  const buildBreakdownText = () => {
    const lines = [];
    lines.push('SIGNS:');
    result.quote.items.forEach(item => {
      lines.push(`  ${item.name} (${item.size}, ${item.spec}) - "${item.text}" - ${fmt(item.lineTotal)}`);
      if (item.description) lines.push(`    ${item.description}`);
      lines.push(`    Supply: ${fmt(item.supply)} | Install: ${fmt(item.install)}`);
    });
    if (result.quote.conditionItems.length > 0) {
      lines.push('');
      lines.push('SITE CONDITIONS:');
      result.quote.conditionItems.forEach(c => {
        lines.push(`  ${c.line} - ${fmt(c.cost)}`);
      });
    }
    lines.push('');
    lines.push('ARTWORK:');
    lines.push(`  ${result.quote.artworkInfo.label} - ${result.quote.artworkTotal > 0 ? fmt(result.quote.artworkTotal) : 'Included'}`);
    lines.push('');
    lines.push(`Subtotal: ${fmt(result.quote.subtotal)}`);
    lines.push(`GST (${Math.round(GST_RATE * 100)}%): ${fmt(result.quote.gst)}`);
    lines.push(`TOTAL inc GST: ${fmt(result.quote.total)}`);
    return lines.join('\n');
  };

  // Build a stable "[name]_[timestamp]" stem used as the filename prefix
  // for any user-initiated downloads on the success screen.
  const fileStem = () => {
    const stamp = new Date().toISOString().slice(0,19).replace(/[T:]/g, '-');
    const safeName = (form.name || 'customer').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    return `strikeprint_${safeName}_${stamp}`;
  };

  // Open the user's mail client as a last-resort fallback (used when the
  // server-side endpoint is unreachable — local dev, missing env var, etc).
  // mailto: can't carry attachments. The success screen exposes manual
  // 'Download Mockup' / 'Download Photo' buttons so the user can grab the
  // files and attach them to the draft themselves — we never auto-download.
  const openMailtoFallback = () => {
    const subject = encodeURIComponent(`Quote request from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\n` +
      `Phone: ${form.phone || '(not provided)'}\n` +
      `Email: ${form.email || '(not provided)'}\n\n` +
      `Customer notes:\n${form.message || '(none)'}\n\n` +
      `--- QUOTE ---\n${buildBreakdownText()}\n\n` +
      `(Customer will attach the mockup + original photo manually.)`
    );
    window.location.href = `mailto:${RECIPIENT_EMAIL}?subject=${subject}&body=${body}`;
    setStatus('sent');
    setStatusMsg('Email draft opening in your mail app — use the download buttons below if you want to attach the mockup or photo.');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setStatus('error'); setStatusMsg(v); return; }

    setStatus('sending'); setStatusMsg('');
    try {
      // Downscale before sending — Vercel Hobby caps request body at 4.5MB
      const [mockupSmall, originalSmall] = await Promise.all([
        result.composite ? downscaleDataUrl(result.composite, 1600, 0.85) : '',
        originalPhoto    ? downscaleDataUrl(originalPhoto,    1600, 0.82) : ''
      ]);

      const r = await fetch(QUOTE_API_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:    form.name,
          customer_phone:   form.phone || '',
          customer_email:   form.email || '',
          customer_message: form.message || '',
          quote_total:      fmt(result.quote.total),
          quote_breakdown:  buildBreakdownText(),
          mockup_dataurl:   mockupSmall,
          original_dataurl: originalSmall
        })
      });

      // 404 = endpoint not deployed (e.g. local dev). 503 = env var missing.
      // In both cases, gracefully fall back to mailto so the user isn't stranded.
      if (r.status === 404 || r.status === 503) {
        openMailtoFallback();
        return;
      }

      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${r.status}`);
      }

      setStatus('sent');
      setStatusMsg("Your quote and mockup are on their way to Strike Print. We'll be in touch soon.");
    } catch (err) {
      console.error(err);
      setStatus('error');
      setStatusMsg('Email send failed: ' + (err.message || 'unknown error'));
    }
  };

  if (status === 'sent') {
    const stem = fileStem();
    return (
      <div className="p-6 anim-scalein text-center"
        style={{ background: `${BRAND.boltAmber}10`, border: `1px solid ${BRAND.boltAmber}`, backdropFilter: 'blur(8px)' }}>
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 flex items-center justify-center"
            style={{ background: BRAND.boltGrad, color: BRAND.navy }}>
            <Check className="w-6 h-6" strokeWidth={3} />
          </div>
        </div>
        <div style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.05em' }} className="text-2xl mb-2">
          REQUEST SENT
        </div>
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#cbd5e1' }}>{statusMsg}</p>

        {result.composite && (
          <div className="pt-4" style={{ borderTop: `1px solid ${BRAND.boltAmber}30` }}>
            <div className="text-[10px] uppercase tracking-[0.2em] mb-3"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
              Want a copy for your records?
            </div>
            <div className="flex justify-center">
              <button onClick={() => downloadDataUrl(result.composite, `${stem}_mockup.jpg`)}
                className="lift inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs uppercase tracking-widest"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'rgba(8,21,46,0.6)',
                  border: `1px solid ${BRAND.navyLineStrong}`,
                  color: BRAND.textPri
                }}>
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                Download Mockup
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 space-y-4"
      style={{ background: 'rgba(15,32,70,0.7)', border: `1px solid ${BRAND.navyLineStrong}`, backdropFilter: 'blur(12px)' }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <FormField label="Your Name *" value={form.name} onChange={update('name')} placeholder="Jane Smith" disabled={status === 'sending'} />
        <FormField label="Phone" value={form.phone} onChange={update('phone')} placeholder="0400 000 000" type="tel" disabled={status === 'sending'} />
      </div>
      <FormField label="Email" value={form.email} onChange={update('email')} placeholder="you@example.com" type="email" disabled={status === 'sending'} />

      <div>
        <Label num="·" text="What do you want on the sign?" />
        <textarea value={form.message} onChange={update('message')}
          placeholder="e.g. business name 'Joe's Coffee', tagline 'Best in Town', open Mon-Sat. Any specific colours, fonts, or details we should know about?"
          rows={4} disabled={status === 'sending'}
          className="w-full mt-2 px-4 py-3 outline-none text-sm resize-none"
          style={{
            fontFamily: "'Outfit', sans-serif",
            background: BRAND.navyRaise,
            border: `1px solid ${BRAND.navyLineStrong}`,
            color: BRAND.textPri
          }} />
      </div>

      <div className="text-[11px]" style={{ color: BRAND.textDim }}>
        Required: name + at least one of phone/email. Your mockup and photo are sent to Strike Print as attachments.
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-3 p-3 text-sm anim-fadeup"
          style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{statusMsg}</span>
        </div>
      )}

      <button onClick={onSubmit} disabled={status === 'sending'}
        className={`group w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${status !== 'sending' ? 'glossy-btn' : ''}`}
        style={{
          background: status === 'sending' ? BRAND.boltAmber : undefined,
          color: BRAND.navy,
          fontFamily: 'Anton, sans-serif',
          letterSpacing: '0.1em'
        }}>
        <span className="flex items-center gap-3">
          {status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          <span className="text-base sm:text-xl">{status === 'sending' ? 'SENDING…' : 'SEND TO STRIKE PRINT'}</span>
        </span>
        {status !== 'sending' && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
      </button>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <div>
      <Label num="·" text={label} />
      <input type={type} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        className="w-full mt-2 px-4 py-3 outline-none text-sm"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          background: BRAND.navyRaise,
          border: `1px solid ${BRAND.navyLineStrong}`,
          color: BRAND.textPri
        }} />
    </div>
  );
}

const downloadDataUrl = (url, filename) => {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

// Re-encode a data URL to JPEG with a max longest-edge dimension. Used to
// keep the API request body under Vercel's 4.5MB Hobby-tier limit. Returns
// the original URL untouched if it's already small enough.
const downscaleDataUrl = (dataUrl, maxDim, quality) => new Promise((resolve, reject) => {
  if (!dataUrl) { resolve(''); return; }
  const img = new Image();
  img.onload = () => {
    let { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) { resolve(dataUrl); return; }
    if (w <= maxDim && h <= maxDim) { resolve(dataUrl); return; }
    const scale = maxDim / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    resolve(c.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => reject(new Error('image decode failed'));
  img.src = dataUrl;
});

// ═══════════════════════════════════════════════════════════════
//   SHARED UI BITS
// ═══════════════════════════════════════════════════════════════
function StageIndicator({ stages }) {
  return (
    <div className="grid gap-1.5 sm:gap-2 mb-8 sm:mb-12" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`, fontFamily: "'JetBrains Mono', monospace" }}>
      {stages.map((s, i) => {
        const clickable = s.enabled && !!s.onClick && !s.active;
        const Tag = clickable ? 'button' : 'div';
        return (
          <Tag key={i}
            onClick={clickable ? s.onClick : undefined}
            disabled={Tag === 'button' ? !clickable : undefined}
            className={`relative flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2.5 sm:py-4 transition-all anim-fadeup stagger-${i+1} ${s.active ? 'anim-pulse' : ''} ${clickable ? 'lift' : ''}`}
            style={{
              background: s.active ? `${BRAND.boltAmber}10` : 'rgba(15,32,70,0.6)',
              border: `1px solid ${s.active ? BRAND.boltAmber : BRAND.navyLine}`,
              backdropFilter: 'blur(8px)',
              cursor: clickable ? 'pointer' : (s.enabled ? 'default' : 'not-allowed'),
              opacity: s.enabled ? 1 : 0.45,
              textAlign: 'left',
              width: '100%',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
            <span style={{ fontFamily: 'Anton, sans-serif', color: s.active ? BRAND.boltAmber : BRAND.textFaint, lineHeight: 1 }}
              className="text-xl sm:text-3xl">{s.n}</span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] truncate"
              style={{ color: s.active ? BRAND.textPri : BRAND.textFaint }}>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.short}</span>
            </span>
          </Tag>
        );
      })}
    </div>
  );
}

function CornerBrackets() {
  return (
    <>
      {[
        { pos: 'top-0 left-0',     rotate: 0   },
        { pos: 'top-0 right-0',    rotate: 90  },
        { pos: 'bottom-0 right-0', rotate: 180 },
        { pos: 'bottom-0 left-0',  rotate: 270 }
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} w-4 h-4 pointer-events-none`} style={{ transform: `rotate(${b.rotate}deg)` }}>
          <div className="absolute top-0 left-0 w-3 h-px" style={{ background: BRAND.boltAmber }} />
          <div className="absolute top-0 left-0 w-px h-3" style={{ background: BRAND.boltAmber }} />
        </div>
      ))}
    </>
  );
}

function SectionHeader({ num, title, big = false }) {
  return (
    <div className="flex items-baseline gap-3 anim-fadeup">
      <span style={{ fontFamily: 'Anton, sans-serif', color: BRAND.boltAmber, letterSpacing: '0.05em', lineHeight: 1 }}
        className={big ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'}>{num}</span>
      <span style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        className={big ? 'text-xl sm:text-3xl' : 'text-base sm:text-xl'}>{title}</span>
      <div className="flex-1 h-px" style={{ background: BRAND.navyLineStrong }} />
    </div>
  );
}

function Label({ num, text, icon: Icon }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>{num}</span>
      <span className="text-xs uppercase tracking-widest" style={{ color: '#cbd5e1' }}>{text}</span>
      {Icon && <Icon className="w-3 h-3" style={{ color: BRAND.textFaint }} />}
    </div>
  );
}

function BadgeLabel({ children }) {
  return (
    <div className="absolute top-3 left-3 z-10 px-2 py-1 text-[10px] uppercase tracking-widest" style={{
      fontFamily: "'JetBrains Mono', monospace",
      background: '#08152e',
      border: `1px solid ${BRAND.navyLineStrong}`,
      color: BRAND.textMuted
    }}>{children}</div>
  );
}

// ═══════════════════════════════════════════════════════════════
//   HOW IT WORKS — first-visit walkthrough modal on Stage 1.
//   Shown until the user dismisses it; dismissal sticks via
//   localStorage('strikeprint:howToSeen'). Re-openable via the
//   '· how it works' link beside the Stage 1 section header.
// ═══════════════════════════════════════════════════════════════
const HOW_IT_WORKS_STEPS = [
  { n: '01', title: 'Snap a photo',     blurb: "Take or upload a photo of your storefront, building, vehicle or interior — wherever the sign is going." },
  { n: '02', title: 'Place your sign',  blurb: "Drag any sign type onto your photo. Position it, resize it, rotate it. See it before you commit." },
  { n: '03', title: 'Get a quote',      blurb: "Generate an itemised estimate. Send it through and we'll come back to finalise pricing and timing." }
];

function HowItWorksModal({ onClose }) {
  // Allow Esc to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portal to body so the modal escapes any backdrop-filter ancestors
  // that would otherwise act as a containing block for fixed positioning.
  return ReactDOM.createPortal(
    <div onClick={onClose}
      className="fixed inset-0 z-[100] anim-fadein overflow-y-auto flex items-start sm:items-center justify-center p-4 sm:p-6"
      style={{
        background: 'rgba(8, 21, 46, 0.92)',
        backdropFilter: 'blur(8px)',
        color: BRAND.textPri,
        fontFamily: "'Outfit', sans-serif"
      }}>
      <div onClick={(e) => e.stopPropagation()}
        className="relative anim-scalein w-full max-w-2xl my-auto"
        style={{
          background: 'rgba(15, 32, 70, 0.92)',
          border: `1px solid ${BRAND.boltAmber}40`,
          borderTop: `3px solid ${BRAND.boltAmber}`,
          backdropFilter: 'blur(12px)'
        }}>
        {/* Close X */}
        <button onClick={onClose} title="Close (Esc)"
          className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 transition-colors hover:bg-white/5"
          style={{ color: BRAND.textMuted, border: `1px solid ${BRAND.navyLineStrong}` }}>
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-10" style={{ background: BRAND.boltGrad }} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
              Before you start
            </span>
          </div>

          <h2 className="mb-1" style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.02em', fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', lineHeight: 1.05 }}>
            How It Works
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: BRAND.textMuted }}>
            Skip the back-and-forth. Compose your sign on a real photo of the site
            and get an instant estimate in under a minute.
          </p>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {HOW_IT_WORKS_STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-4 p-4"
                style={{
                  background: 'rgba(8, 21, 46, 0.55)',
                  border: `1px solid ${BRAND.navyLine}`,
                  borderLeft: `3px solid ${BRAND.boltAmber}`
                }}>
                <span className="flex-shrink-0" style={{
                  fontFamily: 'Anton, sans-serif',
                  fontSize: '2.25rem',
                  color: BRAND.boltAmber,
                  letterSpacing: '0.02em',
                  lineHeight: 1
                }}>{s.n}</span>
                <div className="flex-1 min-w-0">
                  <div className="mb-1" style={{
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: 'clamp(1.15rem, 3vw, 1.4rem)',
                    letterSpacing: '0.03em',
                    lineHeight: 1.1
                  }}>
                    {s.title}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                    {s.blurb}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Confirm */}
          <button onClick={onClose}
            className="glossy-btn group w-full inline-flex items-center justify-between gap-3 px-5 py-4"
            style={{
              background: BRAND.boltGrad,
              color: BRAND.navy,
              fontFamily: 'Anton, sans-serif',
              letterSpacing: '0.1em'
            }}>
            <span className="flex items-center gap-2">
              <Camera className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-base sm:text-lg">Got it — let's start</span>
            </span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="mt-4 flex items-start gap-3 p-4 text-sm anim-fadeup"
      style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span className="break-words">{msg}</span>
    </div>
  );
}
