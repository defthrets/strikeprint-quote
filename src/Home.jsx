import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Phone, Mail, MapPin, Clock, X, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  buildServices, buildHero, buildContact, buildAbout,
  buildServicesIntro, buildContactIntro, buildMaterials,
  buildMaterialsRows, buildPillars, buildReviews, buildBigCta, buildFooter
} from './services-meta.js';

// ════════════════════════════════════════════════════════════════
//   STRIKE PRINT — full single-page redesign
//   Ported 1:1 from the Claude Design handoff (Big Shoulders Display
//   italic + Inter Tight + Instrument Serif, dark/light theme,
//   spring-physics cursor, hero parallax, 3D card tilt, marquee +
//   masonry portfolio with shared lightbox).
// ════════════════════════════════════════════════════════════════

// Curated 15-photo set used by both the hero marquee and the portfolio
// masonry grid. Sourced from /public/portfolio/ — already shipped.
const PHOTOS = [
  ['/portfolio/hero.webp',         'Inhouse production'],
  ['/portfolio/install-01.webp',   'Panels & promotional'],
  ['/portfolio/install-08.webp',   'Wall mural'],
  ['/portfolio/install-19.webp',   'Storefront signage'],
  ['/portfolio/install-04.webp',   'Wall graphics'],
  ['/portfolio/install-32.webp',   'Vehicle wrap'],
  ['/portfolio/install-13.webp',   'Wall graphics'],
  ['/portfolio/install-23.webp',   'Bar graphics'],
  ['/portfolio/install-17.webp',   'Storefront signage'],
  ['/portfolio/install-26.webp',   'Banners'],
  ['/portfolio/install-27.webp',   'Hanging fabric banners'],
  ['/portfolio/install-07.webp',   'Storefront signage'],
  ['/portfolio/install-34.webp',   'Storefront signage'],
  ['/portfolio/install-38.webp',   'Vehicle wrap'],
  ['/portfolio/install-36.webp',   'Storefront signage']
];

// Per-service gallery is now derived from /api/photos at runtime — admin can
// re-tag photos via the /admin panel and the homepage updates after the next
// load. See src/services-meta.js for the slug + title + fallback definitions
// (used when no admin photos are tagged for a category yet).

// PILLARS + MATERIALS rows + all section copy live in services-meta.js
// now and are fetched via /api/photos at runtime (with admin overrides
// applied). The useMemo bindings in the Home component derive them from
// the fetched payload.

// All design CSS — injected once on mount. Keeps the React component
// focused on structure while the visual identity lives in one block.
const HOME_CSS = `
  :root {
    --navy: #012659;
    --navy-deep: #08152e;
    --navy-card: rgba(8, 21, 46, 0.95);
    --navy-raise: rgba(15, 32, 70, 0.7);
    --line: rgba(255, 255, 255, 0.08);
    --line-strong: rgba(255, 255, 255, 0.15);
    --amber: #f59a10;
    --orange: #f0601f;
    --yellow: #fad905;
    --text: #f8fafc;
    --muted: #cbd5e1;
    --dim: #94a3b8;
    --faint: #64748b;
    --grad: linear-gradient(135deg, #f59a10, #f0601f, #fad905);
    --bg-1: rgba(245,154,16,0.10);
    --bg-2: rgba(240,96,31,0.08);
    --bg-base-1: #08152e;
    --bg-base-2: #012659;
    --grain-opacity: 0.06;
    --grain-blend: overlay;
    --header-bg: rgba(8, 21, 46, 0.78);
    --header-bg-scrolled: rgba(8, 21, 46, 0.92);
    --map-filter: grayscale(0.35) contrast(1.05);
    --shadow-card: 0 18px 50px rgba(0,0,0,0.45);
  }
  [data-theme="light"] {
    --navy: #08152e;
    --navy-deep: #ffffff;
    --navy-card: rgba(255, 255, 255, 0.96);
    --navy-raise: rgba(255, 255, 255, 0.85);
    --line: rgba(8, 21, 46, 0.08);
    --line-strong: rgba(8, 21, 46, 0.16);
    --text: #0c1e44;
    --muted: #475569;
    --dim: #64748b;
    --faint: #94a3b8;
    --bg-1: rgba(245,154,16,0.16);
    --bg-2: rgba(240,96,31,0.10);
    --bg-base-1: #faf7f2;
    --bg-base-2: #f1ece2;
    --grain-opacity: 0.05;
    --grain-blend: multiply;
    --header-bg: rgba(255, 255, 255, 0.78);
    --header-bg-scrolled: rgba(255, 255, 255, 0.94);
    --map-filter: contrast(1.02) saturate(0.95);
    --shadow-card: 0 18px 50px rgba(8, 21, 46, 0.18);
  }
  .strike-page *, .strike-page *::before, .strike-page *::after { box-sizing: border-box; }
  .strike-page {
    font-family: 'Inter Tight', sans-serif;
    font-feature-settings: 'ss01', 'cv11';
    color: var(--text);
    background:
      radial-gradient(ellipse at top left, var(--bg-1), transparent 60%),
      radial-gradient(ellipse at bottom right, var(--bg-2), transparent 60%),
      linear-gradient(180deg, var(--bg-base-1) 0%, var(--bg-base-2) 100%);
    background-attachment: fixed;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    transition: color .3s, background-color .3s;
    min-height: 100vh;
  }
  html { scroll-behavior: smooth; }
  ::selection { background: var(--amber); color: #08152e; }
  .strike-page a { color: inherit; }

  /* Grain overlay */
  .grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 1;
    opacity: var(--grain-opacity);
    mix-blend-mode: var(--grain-blend);
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.65'/></svg>");
  }

  /* Section numerals */
  .sect-num {
    position: absolute;
    top: 16px; right: 28px;
    font-family: 'Big Shoulders Display', sans-serif;
    font-weight: 900; font-style: italic;
    font-size: clamp(80px, 14vw, 200px);
    line-height: 1;
    padding-right: 0.08em;
    color: transparent;
    -webkit-text-stroke: 1.5px rgba(245,154,16,0.18);
    letter-spacing: 0.02em;
    pointer-events: none;
    user-select: none;
    z-index: 0;
  }

  /* Card hover spotlight */
  .service { transform-style: preserve-3d; }
  .service::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle 180px at var(--mx, 50%) var(--my, 50%), rgba(245,154,16,0.22), transparent 60%);
    opacity: 0; transition: opacity .3s;
    pointer-events: none; z-index: 1;
  }
  .service:hover::before { opacity: 1; }
  .service > * { position: relative; z-index: 2; }

  .anton { font-family: 'Big Shoulders Display', sans-serif; font-weight: 900; font-style: italic; letter-spacing: -0.01em; }
  .bebas { font-family: 'Big Shoulders Display', sans-serif; font-weight: 800; }
  .mono  { font-family: 'JetBrains Mono', monospace; }
  .serif-i { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; letter-spacing: -0.01em; }
  .grad-text {
    background: var(--grad);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
    padding: 0.12em 0.18em 0.14em 0.04em;
    margin: -0.12em 0 -0.14em -0.04em;
    overflow: visible;
  }

  /* Header */
  .header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    background: var(--header-bg);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line);
    transition: background-color .3s, border-color .3s;
  }
  .header-inner {
    max-width: 1280px; margin: 0 auto;
    padding: 14px 28px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .brand-mark {
    height: 64px; width: auto; display: block; object-fit: contain;
    filter: drop-shadow(0 4px 16px rgba(245,154,16,0.4));
  }
  .nav-links { display: flex; align-items: center; gap: 4px; }
  .nav-link {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--muted); text-decoration: none;
    padding: 9px 14px;
    transition: color .2s;
    background: none; border: none; cursor: pointer;
  }
  .nav-link:hover { color: var(--amber); }
  .cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 20px;
    background: var(--grad);
    color: var(--navy);
    font-family: 'Big Shoulders Display', sans-serif;
    font-weight: 800; font-style: italic;
    letter-spacing: 0.02em; text-transform: uppercase;
    text-decoration: none;
    border-radius: 12px;
    font-size: 14px;
    border: none; cursor: pointer;
    position: relative; overflow: hidden;
    transition: transform .2s;
  }
  .cta:hover { transform: translateY(-2px); }
  .cta::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
    transform: translateX(-100%);
  }
  .cta:hover::before { animation: gloss .9s ease-out forwards; }
  @keyframes gloss { to { transform: translateX(200%); } }

  .theme-toggle {
    width: 38px; height: 38px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    color: var(--text);
    cursor: pointer;
    transition: border-color .2s, color .2s, transform .2s;
    margin-left: 6px;
  }
  .theme-toggle:hover { border-color: var(--amber); color: var(--amber); transform: translateY(-1px); }

  /* Hero */
  .hero { position: relative; padding: 140px 28px 80px; text-align: center; overflow: hidden; }
  .hero-grid {
    position: absolute; inset: 0; pointer-events: none;
    background:
      linear-gradient(rgba(245,154,16,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,154,16,0.07) 1px, transparent 1px);
    background-size: 64px 64px;
    -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, black, transparent 75%);
            mask-image: radial-gradient(ellipse 70% 60% at 50% 35%, black, transparent 75%);
    animation: shimmer 6s ease-in-out infinite;
    transform: translate3d(var(--gridX, 0px), var(--gridY, 0px), 0);
    transition: transform 0.6s cubic-bezier(.2,.7,.3,1);
  }
  .hero-bolt {
    position: absolute; top: 50%; left: 50%;
    width: clamp(420px, 55vw, 720px); aspect-ratio: 3 / 2;
    transform: translate3d(calc(-50% + var(--bx, 0px)), calc(-50% + var(--by, 0px)), 0);
    background-image: url('/logo.webp');
    background-repeat: no-repeat; background-position: center center; background-size: contain;
    opacity: 0.05; pointer-events: none;
    filter: blur(0.5px);
    transition: transform 0.8s cubic-bezier(.2,.7,.3,1), opacity 0.6s;
    z-index: 0;
  }
  .hero h1, .hero p.lede, .eyebrow, .hero-actions, .marquee-section { position: relative; z-index: 1; }
  @keyframes shimmer { 0%,100% { opacity: .35; } 50% { opacity: .85; } }
  .orb { position: absolute; pointer-events: none; border-radius: 50%; filter: blur(60px); }
  .orb-a { top: 6%; left: -8%; width: 55vw; height: 55vw; background: radial-gradient(circle, rgba(240,96,31,0.38), transparent 65%); animation: orbA 22s ease-in-out infinite; }
  .orb-b { top: -12%; right: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(245,154,16,0.34), transparent 65%); animation: orbB 28s ease-in-out infinite -4s; }
  .orb-c { bottom: -15%; left: 25%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(250,217,5,0.24), transparent 65%); animation: orbC 18s ease-in-out infinite -7s; }
  @keyframes orbA { 0%,100%{transform:translate3d(0,0,0) scale(1)} 33%{transform:translate3d(8%,-6%,0) scale(1.08)} 66%{transform:translate3d(-6%,8%,0) scale(.94)} }
  @keyframes orbB { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(-10%,10%,0) scale(1.12)} }
  @keyframes orbC { 0%,100%{transform:translate3d(0,0,0) scale(1)} 40%{transform:translate3d(7%,-10%,0) scale(1.06)} 80%{transform:translate3d(-5%,5%,0) scale(.96)} }

  .eyebrow { display: inline-flex; align-items: center; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; justify-content: center; }
  .eyebrow .line { height: 1px; width: 60px; background: var(--grad); }
  .eyebrow .label { font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3em; font-weight: 700; color: var(--amber); }
  .hero h1 {
    font-family: 'Big Shoulders Display', sans-serif;
    font-weight: 900; font-style: italic;
    letter-spacing: -0.01em;
    font-size: clamp(3rem, 9vw, 7rem);
    line-height: 1.02;
    padding: 0.06em 0.04em 0.04em 0;
    margin: 0 0 24px;
    position: relative;
  }
  .glitch {
    display: inline-block;
    background: var(--grad);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    padding: 0.12em 0.18em 0.14em 0.04em;
    margin: -0.12em 0 -0.14em -0.04em;
    overflow: visible;
    animation: glitch 8s steps(1) infinite;
  }
  @keyframes glitch {
    0%, 92%, 100% { transform: translate(0,0); text-shadow: none; }
    92.6% { transform: translate(-2px,0); text-shadow: 2px 0 rgba(0,200,255,0.55), -2px 0 rgba(240,96,31,0.55); }
    93.2% { transform: translate(2px,1px); text-shadow: -2px 0 rgba(0,200,255,0.55), 2px 0 rgba(240,96,31,0.55); }
    93.8% { transform: translate(-1px,-1px); text-shadow: 1px 0 rgba(245,154,16,0.7); }
    94.4% { transform: translate(0,0); text-shadow: none; }
    95.0% { transform: translate(3px,0); text-shadow: -3px 0 rgba(0,200,255,0.7), 3px 0 rgba(240,96,31,0.7); }
    95.6% { transform: translate(-1px,0); text-shadow: 1px 0 rgba(245,154,16,0.5); }
    96.2% { transform: translate(0,0); text-shadow: none; }
  }
  .hero p.lede { max-width: 640px; margin: 0 auto; font-size: clamp(15px, 2vw, 19px); line-height: 1.6; color: var(--muted); }
  .hero-actions { display: inline-flex; gap: 14px; margin-top: 36px; flex-wrap: wrap; justify-content: center; }
  .btn-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px;
    background: transparent;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    color: var(--text);
    font-family: 'JetBrains Mono', monospace; letter-spacing: 0.18em; text-transform: uppercase;
    font-weight: 600; font-size: 12px; text-decoration: none;
    transition: border-color .2s, color .2s;
    cursor: pointer;
  }
  .btn-secondary:hover { border-color: var(--amber); color: var(--amber); }

  /* Marquee */
  .marquee-section { position: relative; margin-top: 56px; padding-bottom: 24px; }
  .marquee-mask {
    overflow: hidden;
    -webkit-mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
  }
  .marquee-track { display: flex; gap: 14px; width: max-content; animation: scroll 110s linear infinite; }
  .marquee-track:hover { animation-play-state: paused; }
  @keyframes scroll { to { transform: translate3d(-50%, 0, 0); } }
  .show-card {
    flex-shrink: 0;
    width: clamp(220px, 26vw, 320px);
    aspect-ratio: 4/3;
    background: var(--navy-deep);
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    position: relative; overflow: hidden;
    transition: transform .45s cubic-bezier(.2,.7,.3,1), border-color .45s, box-shadow .45s;
    cursor: zoom-in;
  }
  .show-card:hover { transform: translateY(-6px); border-color: var(--amber); box-shadow: 0 18px 50px rgba(0,0,0,0.45), 0 0 0 1px var(--amber); }
  .show-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(0.92) brightness(0.92); transition: transform 1.2s cubic-bezier(.2,.7,.3,1), filter .6s; }
  .show-card:hover img { transform: scale(1.06); filter: saturate(1.05) brightness(1); }
  .show-label {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 14px 16px;
    background: linear-gradient(to top, rgba(8,21,46,0.95), rgba(8,21,46,0.65) 60%, transparent);
    display: flex; align-items: center; gap: 8px;
    transform: translateY(35%); opacity: 0.8;
    transition: transform .45s cubic-bezier(.2,.7,.3,1), opacity .45s;
  }
  .show-card:hover .show-label { transform: translateY(0); opacity: 1; }
  .show-label .tick { width: 16px; height: 1px; background: var(--amber); }
  .show-label span:last-child { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.22em; font-weight: 700; }

  /* Sections */
  .section { max-width: 1280px; margin: 0 auto; padding: 80px 28px; position: relative; }
  .sect-header { text-align: center; }
  .sect-eyebrow { display: inline-flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .sect-eyebrow .line { height: 1px; width: 50px; background: var(--grad); }
  .sect-eyebrow .label { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--amber); font-weight: 700; }
  .sect-title { font-family: 'Big Shoulders Display', sans-serif; font-weight: 900; font-style: italic; font-size: clamp(2.2rem, 6.5vw, 4rem); letter-spacing: -0.005em; line-height: 1.05; padding: 0.04em 0.06em 0.04em 0; margin: 0; text-transform: uppercase; }
  .sect-intro { max-width: 640px; margin: 16px auto 0; text-align: center; color: var(--muted); font-size: clamp(14px, 1.6vw, 17px); line-height: 1.6; }

  /* Pillars */
  .pillars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 48px; }
  .pillar {
    background: var(--navy-raise); border: 1px solid var(--line);
    border-top: 2px solid var(--amber); border-radius: 12px;
    padding: 24px;
    transition: transform .3s, border-color .3s;
  }
  .pillar:hover { transform: translateY(-4px); }
  .pillar .key { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--amber); margin-bottom: 10px; font-weight: 700; }
  .pillar .body { font-size: 14px; color: var(--muted); line-height: 1.6; }

  /* Services */
  .services { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 48px; }
  .service {
    background: var(--navy-raise); border: 1px solid var(--line-strong);
    border-radius: 14px; padding: 28px 24px;
    position: relative; overflow: hidden;
    transition: transform .3s, border-color .3s, box-shadow .3s;
  }
  .service-corner { position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: linear-gradient(225deg, rgba(245,154,16,0.18), transparent 60%); pointer-events: none; z-index: 1; }
  .service { cursor: zoom-in; }
  .service:hover { transform: translateY(-4px); border-color: var(--amber); box-shadow: 0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(245,154,16,0.4); }
  .service:focus-visible { outline: 2px solid var(--amber); outline-offset: 4px; }
  .service .num { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--dim); margin-bottom: 14px; }
  /* Service cover: category preview image. Click cycles a per-service
     lightbox of related photos (replaces the old SVG icon box). */
  .service-cover {
    position: relative; overflow: hidden;
    aspect-ratio: 16 / 10;
    margin: 0 -24px 18px; /* break out of the card padding */
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background: var(--navy-deep);
  }
  .service-cover img {
    position: absolute; inset: 0;
    width: 100%; height: 100%; object-fit: cover; display: block;
    filter: saturate(0.95) brightness(0.92);
    transition: transform .9s cubic-bezier(.2,.7,.3,1), filter .4s;
  }
  .service:hover .service-cover img { transform: scale(1.06); filter: saturate(1.05) brightness(1); }
  .service-cover-shade {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 35%, rgba(8,21,46,0.75) 100%);
    pointer-events: none;
  }
  [data-theme="light"] .service-cover-shade {
    background: linear-gradient(180deg, transparent 35%, rgba(8,21,46,0.55) 100%);
  }
  .service-cover-count {
    position: absolute; left: 14px; bottom: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.22em;
    text-transform: uppercase; font-weight: 700;
    color: #f8fafc;
    display: flex; align-items: center; gap: 8px;
    z-index: 2;
  }
  .service-cover-count .tick { width: 14px; height: 1px; background: var(--amber); }
  .service h3 { font-family: 'Big Shoulders Display', sans-serif; font-weight: 800; font-size: clamp(24px, 3vw, 32px); letter-spacing: 0; line-height: 1.05; margin: 0 0 10px; text-transform: uppercase; }
  .service p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.6; }

  /* About + materials */
  .about-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 56px; align-items: center; margin-top: 48px; }
  .about h2 { font-family: 'Big Shoulders Display', sans-serif; font-weight: 900; font-style: italic; font-size: clamp(2rem, 5.5vw, 3.5rem); letter-spacing: -0.005em; line-height: 1.05; padding: 0.04em 0.06em 0.04em 0; margin: 0 0 20px; text-transform: uppercase; }
  .about p { color: var(--muted); font-size: 16px; line-height: 1.7; margin: 0 0 16px; }
  .materials {
    background: var(--navy-deep); border: 1px solid var(--line-strong);
    border-top: 2px solid var(--amber); border-radius: 14px;
    padding: 32px;
  }
  .materials .head { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--amber); margin-bottom: 24px; font-weight: 700; }
  .materials .row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
  .materials .row:last-child { border-bottom: none; }
  .materials .row strong { font-family: 'Big Shoulders Display', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: 0; color: var(--text); }
  .materials .row span { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-family: 'JetBrains Mono', monospace; }

  /* Contact */
  .contact-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 40px; }
  .ct {
    background: var(--navy-raise); border: 1px solid var(--line-strong);
    border-radius: 12px; padding: 22px;
    text-decoration: none; color: var(--text);
    display: block; transition: transform .25s, border-color .25s;
  }
  .ct:hover { transform: translateY(-3px); border-color: var(--amber); }
  .ct .label { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--dim); }
  .ct .label svg { color: var(--amber); }
  .ct .value { font-family: 'Inter Tight', sans-serif; font-weight: 600; font-size: 16px; line-height: 1.3; letter-spacing: -0.01em; }

  .map-wrap {
    margin-top: 28px; position: relative; overflow: hidden;
    background: var(--navy-deep); border: 1px solid var(--line-strong);
    border-top: 2px solid var(--amber); border-radius: 14px;
  }
  .map-wrap iframe {
    display: block; width: 100%;
    height: clamp(320px, 45vw, 460px);
    border: 0;
    filter: var(--map-filter);
  }
  .map-overlay {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 16px 22px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: linear-gradient(to top, rgba(8,21,46,0.96), rgba(8,21,46,0.5) 80%, transparent);
    pointer-events: none;
  }
  .map-overlay .addr { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 14px; color: #f8fafc; }
  .map-overlay .addr svg { color: var(--amber); }
  .map-overlay a {
    pointer-events: auto;
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 16px;
    background: var(--grad);
    color: var(--navy);
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700;
    text-decoration: none;
    border-radius: 12px 12px 12px 2px;
    transition: transform .2s;
  }
  .map-overlay a:hover { transform: translateY(-2px); }

  .reviews-strip {
    margin-top: 28px;
    background: var(--navy-raise); border: 1px solid var(--line-strong);
    border-radius: 14px; padding: 28px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 24px; flex-wrap: wrap;
  }
  .stars { display: inline-flex; gap: 4px; color: var(--amber); font-size: 22px; }
  .reviews-strip .copy { flex: 1; min-width: 240px; }
  .reviews-strip .copy .title { font-family: 'Big Shoulders Display', sans-serif; font-weight: 800; font-size: 28px; text-transform: uppercase; }
  .reviews-strip .copy .sub { color: var(--muted); font-size: 13px; margin-top: 4px; }

  .big-cta {
    margin-top: 48px;
    position: relative; overflow: hidden;
    background: var(--navy-deep);
    border: 1px solid rgba(245,154,16,0.4);
    border-left: 4px solid var(--amber);
    padding: 48px;
    display: flex; flex-wrap: wrap; align-items: center; gap: 32px;
    border-radius: 14px;
  }
  .big-cta-glow {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 500px 200px at 80% 50%, rgba(245,154,16,0.18), transparent 70%);
    pointer-events: none;
    animation: pulseGlow 3.5s ease-in-out infinite;
  }
  @keyframes pulseGlow { 0%,100% { opacity: .7 } 50% { opacity: 1 } }
  .big-cta-copy { flex: 1; min-width: 260px; position: relative; z-index: 1; }
  .big-cta-copy .eb { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--amber); margin-bottom: 10px; }
  .big-cta-copy h3 { font-family: 'Big Shoulders Display', sans-serif; font-weight: 900; font-style: italic; font-size: clamp(1.6rem, 4vw, 2.6rem); line-height: 1.05; padding: 0.04em 0.06em 0.04em 0; margin: 0 0 14px; text-transform: uppercase; }
  .big-cta-copy p { color: var(--muted); font-size: 15px; line-height: 1.6; margin: 0; }

  .footer {
    max-width: 1280px; margin: 24px auto 0; padding: 32px 28px;
    border-top: 1px solid var(--line);
    display: flex; justify-content: space-between; align-items: center;
    gap: 16px; flex-wrap: wrap;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--faint);
  }
  .footer a { color: var(--faint); text-decoration: none; transition: color .2s; }
  .footer a:hover { color: var(--amber); }
  .footer .right { display: flex; gap: 24px; align-items: center; }
  /* Tiny admin shortcut — bolt icon next to the tagline. Faint by
     default so it doesn't draw eyes; amber on hover matches the
     header logo's amber drop-shadow. */
  .admin-bolt {
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px;
    margin-left: 10px;
    vertical-align: middle;
    color: var(--faint);
    opacity: 0.4;
    transition: opacity .2s, color .2s, transform .2s;
  }
  .admin-bolt:hover { opacity: 1; color: var(--amber); transform: scale(1.1); }

  /* Reveal */
  .reveal { opacity: 0; transform: translateY(20px); transition: opacity .8s cubic-bezier(.2,.7,.3,1), transform .8s cubic-bezier(.2,.7,.3,1); }
  .reveal.in { opacity: 1; transform: translateY(0); }

  /* Lightbox */
  .lightbox {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(8, 21, 46, 0.92);
    backdrop-filter: blur(14px);
    display: flex; align-items: center; justify-content: center;
    padding: 40px;
    opacity: 1;
  }
  .lightbox-img {
    max-width: 92vw; max-height: 86vh; object-fit: contain;
    border: 1px solid rgba(245,154,16,0.4);
    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
    transform: scale(1);
    cursor: zoom-out;
  }
  .lightbox-caption {
    position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.22em; font-weight: 700;
    color: #f8fafc;
    background: rgba(8, 21, 46, 0.7);
    border: 1px solid rgba(245,154,16,0.35);
    padding: 8px 16px;
    display: flex; align-items: center; gap: 10px;
    border-radius: 10px;
  }
  .lightbox-caption .tick { width: 14px; height: 1px; background: var(--amber); }
  .lightbox-btn {
    position: absolute;
    background: transparent; color: #f8fafc;
    border: 1px solid rgba(255,255,255,0.25);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: border-color .2s, color .2s, background .2s, transform .2s;
    border-radius: 10px;
  }
  .lightbox-btn:hover { border-color: var(--amber); color: var(--amber); background: rgba(245,154,16,0.08); }
  .lightbox-close { top: 24px; right: 24px; width: 44px; height: 44px; }
  .lightbox-close:hover { transform: rotate(90deg); }
  .lightbox-nav { top: 50%; transform: translateY(-50%); width: 52px; height: 52px; }
  .lightbox-nav.prev { left: 24px; }
  .lightbox-nav.next { right: 24px; }
  .lightbox-counter {
    position: absolute; top: 32px; left: 50%; transform: translateX(-50%);
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    color: #f8fafc; opacity: 0.7; letter-spacing: 0.18em;
  }

  @media (max-width: 1100px) {
    .pillars { grid-template-columns: repeat(2, 1fr); }
    .services { grid-template-columns: repeat(2, 1fr); }
    .about-grid { grid-template-columns: 1fr; gap: 32px; }
    .contact-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 720px) {
    .nav-links .nav-link { display: none; }
    .header-inner { padding: 10px 18px; }
    .section { padding: 56px 18px; }
    .hero { padding: 120px 18px 56px; }
    .services { grid-template-columns: 1fr; }
    .pillars { grid-template-columns: 1fr; }
    .contact-grid { grid-template-columns: 1fr; }
    .big-cta { padding: 28px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .marquee-track, .orb, .hero-grid, .glitch, .big-cta-glow { animation: none !important; }
  }
`;

export default function Home() {
  const [lightbox, setLightbox] = useState(null); // { items: [...], idx: number } | null
  // Admin-managed content. `content` holds the *server-merged* values
  // (defaults overlaid with admin overrides). Empty until /api/photos
  // resolves — derivations below fall back to compiled defaults so the
  // page renders instantly even before the fetch returns.
  const [photos, setPhotos] = useState([]);
  const [serviceOverrides, setServiceOverrides] = useState({});
  const [content, setContent] = useState(null);
  const heroRef = useRef(null);
  const heroBoltRef = useRef(null);
  const heroGridRef = useRef(null);
  const headerRef = useRef(null);

  // Derive everything the JSX needs. Memoised so reference identity stays
  // stable across re-renders (matters for the lightbox: a fresh `gallery`
  // array on every render would break idx tracking).
  const SERVICES        = useMemo(() => buildServices(photos, serviceOverrides), [photos, serviceOverrides]);
  const HERO            = useMemo(() => content?.hero           || buildHero(),           [content]);
  const CONTACT         = useMemo(() => content?.contact        || buildContact(),        [content]);
  const ABOUT           = useMemo(() => content?.about          || buildAbout(),          [content]);
  const SERVICES_INTRO  = useMemo(() => content?.services_intro || buildServicesIntro(),  [content]);
  const CONTACT_INTRO   = useMemo(() => content?.contact_intro  || buildContactIntro(),   [content]);
  const MATERIALS       = useMemo(() => content?.materials      || buildMaterials(),      [content]);
  const MATERIALS_ROWS  = useMemo(() => content?.materials_rows || buildMaterialsRows(),  [content]);
  const PILLARS         = useMemo(() => content?.pillars        || buildPillars(),        [content]);
  const REVIEWS         = useMemo(() => content?.reviews        || buildReviews(),        [content]);
  const BIG_CTA         = useMemo(() => content?.big_cta        || buildBigCta(),         [content]);
  const FOOTER          = useMemo(() => content?.footer         || buildFooter(),         [content]);

  // ── Inject fonts + styles on mount ──
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Inter+Tight:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id = 'strikeprint-home-styles';
    style.textContent = HOME_CSS;
    document.head.appendChild(style);

    // Force dark mode — light-theme support was removed. Defensive cleanup
    // for returning visitors who had `light` saved from when the toggle
    // existed: remove the data-theme attr (so :root dark vars kick in)
    // and clear the stored preference so it never re-applies.
    document.documentElement.removeAttribute('data-theme');
    try { localStorage.removeItem('strike-theme'); } catch {}

    return () => {
      try { document.head.removeChild(link); } catch {}
      try { document.head.removeChild(style); } catch {}
    };
  }, []);

  // Fetch admin-managed content from /api/photos. The endpoint is
  // CDN-cached (10s s-maxage) so this is cheap and shared across visitors.
  // Returns photos + service overrides + hero + contact in one shot.
  // If it fails, every state stays empty and SERVICES/HERO/CONTACT use
  // their compiled-in defaults — the page never blanks out on a blip.
  //
  // Also re-fetches when the tab regains focus, so a visitor who left the
  // homepage open while admin made changes sees the new content the next
  // time they look at it (without a manual reload). Cheap thanks to the
  // CDN cache — at most one origin hit per 10s window across all tabs.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch('/api/photos', { credentials: 'omit' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (cancelled || !data) return;
          if (Array.isArray(data.photos)) setPhotos(data.photos);
          if (data.services && typeof data.services === 'object') setServiceOverrides(data.services);
          // Stash the whole merged content payload — useMemo derivations
          // pluck individual sections off it. data is server-merged, so
          // every section already has all fields populated (defaults +
          // overrides), no client-side merging needed.
          setContent(data);
        })
        .catch(() => { /* fallback to compiled defaults */ });
    };
    load();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // ── Hero parallax: drift grid + ghost bolt with cursor ──
  useEffect(() => {
    const hero = heroRef.current;
    const grid = heroGridRef.current;
    const bolt = heroBoltRef.current;
    if (!hero) return;
    const onMove = (e) => {
      const r = hero.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const dy = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (grid) {
        grid.style.setProperty('--gridX', (dx * -14) + 'px');
        grid.style.setProperty('--gridY', (dy * -14) + 'px');
      }
      if (bolt) {
        bolt.style.setProperty('--bx', (dx * 24) + 'px');
        bolt.style.setProperty('--by', (dy * 18) + 'px');
      }
    };
    hero.addEventListener('mousemove', onMove);
    return () => hero.removeEventListener('mousemove', onMove);
  }, []);

  // ── Tilt + shine on service cards ──
  useEffect(() => {
    const cards = document.querySelectorAll('.service');
    const handlers = [];
    cards.forEach(card => {
      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * 100;
        const py = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty('--mx', px + '%');
        card.style.setProperty('--my', py + '%');
        const rx = ((py - 50) / 50) * -3;
        const ry = ((px - 50) / 50) * 3;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      };
      const onLeave = () => { card.style.transform = ''; };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      handlers.push([card, onMove, onLeave]);
    });
    return () => {
      handlers.forEach(([c, m, l]) => {
        c.removeEventListener('mousemove', m);
        c.removeEventListener('mouseleave', l);
      });
    };
  }, []);

  // ── Header solidify on scroll ──
  useEffect(() => {
    const h = headerRef.current;
    if (!h) return;
    const onScroll = () => {
      const styles = getComputedStyle(document.documentElement);
      h.style.background = window.scrollY > 40
        ? styles.getPropertyValue('--header-bg-scrolled')
        : styles.getPropertyValue('--header-bg');
      h.style.borderBottomColor = window.scrollY > 40
        ? 'rgba(245,154,16,0.25)'
        : styles.getPropertyValue('--line');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Reveal on scroll ──
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ── Lightbox keyboard nav + body scroll lock ──
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape')          setLightbox(null);
      else if (e.key === 'ArrowLeft')  setLightbox(lb => lb && { ...lb, idx: (lb.idx - 1 + lb.items.length) % lb.items.length });
      else if (e.key === 'ArrowRight') setLightbox(lb => lb && { ...lb, idx: (lb.idx + 1) % lb.items.length });
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const openLightbox = useCallback((items, idx) => setLightbox({ items, idx }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const nextLightbox = useCallback(() => setLightbox(lb => lb && { ...lb, idx: (lb.idx + 1) % lb.items.length }), []);
  const prevLightbox = useCallback(() => setLightbox(lb => lb && { ...lb, idx: (lb.idx - 1 + lb.items.length) % lb.items.length }), []);

  const year = new Date().getFullYear();

  return (
    <div className="strike-page">
      <div className="grain" aria-hidden="true" />

      {/* Header */}
      <header ref={headerRef} className="header">
        <div className="header-inner">
          <a href="#top" className="brand" aria-label="Strike Print">
            <img className="brand-mark" src="/logo.webp" alt="Strike Print" style={{ width: 128, height: 81 }} />
          </a>
          <nav className="nav-links">
            <a href="#services" className="nav-link">Work</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="cta">Call now →</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="top" ref={heroRef} className="hero">
        <div ref={heroGridRef} className="hero-grid" />
        <div ref={heroBoltRef} className="hero-bolt" />
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />

        <div className="eyebrow">
          <span className="line" />
          <span className="label">{HERO.eyebrow}</span>
          <span className="line" />
        </div>
        <h1>
          {HERO.headlinePre}{HERO.headlinePre && <br />}
          {HERO.headlineGlitch && <span className="glitch">{HERO.headlineGlitch}</span>}
          {HERO.headlinePost && (HERO.headlineGlitch ? ' ' : '')}{HERO.headlinePost}
        </h1>
        <p className="lede" style={{ whiteSpace: 'pre-line' }}>{HERO.lede}</p>
        <div className="hero-actions">
          <a href="#services" className="btn-secondary">{HERO.ctaPrimary}</a>
          <a href="#contact" className="btn-secondary">{HERO.ctaSecondary}</a>
        </div>

        <div className="marquee-section">
          <div className="marquee-mask">
            <div className="marquee-track">
              {[...PHOTOS, ...PHOTOS].map(([src, label], i) => (
                <div key={i} className="show-card"
                  onClick={() => openLightbox(PHOTOS.map(([s, l]) => ({ src: s, label: l })), i % PHOTOS.length)}>
                  <img src={src} alt={label} loading="lazy" decoding="async" />
                  <div className="show-label">
                    <span className="tick" />
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="section">
        <span className="sect-num">01</span>
        <div className="sect-header">
          <div className="sect-eyebrow">
            <span className="line" /><span className="label">{ABOUT.eyebrow}</span><span className="line" />
          </div>
          <h2 className="sect-title">
            {ABOUT.titlePre}{ABOUT.titlePre && ABOUT.titleGrad ? ' ' : ''}
            {ABOUT.titleGrad && <span className="grad-text">{ABOUT.titleGrad}</span>}
            {ABOUT.titlePost}
          </h2>
          <p className="sect-intro" style={{ whiteSpace: 'pre-line' }}>{ABOUT.intro1}</p>
          <p className="sect-intro" style={{ marginTop: 16, whiteSpace: 'pre-line' }}>{ABOUT.intro2}</p>
        </div>

        <div className="pillars">
          {PILLARS.map((p, i) => (
            <div key={i} className="pillar reveal">
              <div className="key">{p.key}</div>
              <div className="body">{p.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section">
        <span className="sect-num">02</span>
        <div className="sect-header">
          <div className="sect-eyebrow">
            <span className="line" /><span className="label">{SERVICES_INTRO.eyebrow}</span><span className="line" />
          </div>
          <h2 className="sect-title">{SERVICES_INTRO.title}</h2>
          <p className="sect-intro" style={{ whiteSpace: 'pre-line' }}>{SERVICES_INTRO.intro}</p>
        </div>

        <div className="services">
          {SERVICES.map(s => (
            <div key={s.num}
              className="service reveal"
              onClick={() => openLightbox(s.gallery, 0)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(s.gallery, 0);
                }
              }}>
              <div className="service-corner" aria-hidden />
              <div className="num">Service · {s.num} / 06</div>
              <div className="service-cover">
                <img src={s.cover} alt={s.title} loading="lazy" decoding="async" />
                <div className="service-cover-shade" aria-hidden />
                <div className="service-cover-count">
                  <span className="tick" />
                  <span>{String(s.gallery.length).padStart(2, '0')} {s.gallery.length === 1 ? 'photo' : 'photos'}</span>
                </div>
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Materials / Quality strip */}
      <section className="section about" style={{ paddingTop: 0 }}>
        <div className="about-grid">
          <div className="reveal">
            <h2>
              {MATERIALS.titlePre}{MATERIALS.titlePre && MATERIALS.titleGrad ? ' ' : ''}
              {MATERIALS.titleGrad && <span className="grad-text">{MATERIALS.titleGrad}</span>}
              {MATERIALS.titlePost}
            </h2>
            <p style={{ whiteSpace: 'pre-line' }}>{MATERIALS.body1}</p>
            <p style={{ whiteSpace: 'pre-line' }}>{MATERIALS.body2}</p>
            <a href="#contact" className="btn-secondary" style={{ marginTop: 8 }}>{MATERIALS.ctaLabel}</a>
          </div>
          <div className="materials reveal">
            <div className="head">{MATERIALS.boxTitle}</div>
            {MATERIALS_ROWS.map((m, i) => (
              <div key={i} className="row">
                <strong>{m.name}</strong>
                <span>{m.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="section">
        <span className="sect-num">03</span>
        <div className="sect-header">
          <div className="sect-eyebrow">
            <span className="line" /><span className="label">{CONTACT_INTRO.eyebrow}</span><span className="line" />
          </div>
          <h2 className="sect-title">{CONTACT_INTRO.title}</h2>
          <p className="sect-intro" style={{ whiteSpace: 'pre-line' }}>{CONTACT_INTRO.intro}</p>
        </div>

        <div className="contact-grid">
          <a className="ct" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>
            <div className="label"><Phone width={14} height={14} strokeWidth={2} />Phone</div>
            <div className="value">{CONTACT.phone}</div>
          </a>
          <a className="ct" href={`mailto:${CONTACT.email}`}>
            <div className="label"><Mail width={14} height={14} strokeWidth={2} />Email</div>
            <div className="value">{CONTACT.email}</div>
          </a>
          <a className="ct" target="_blank" rel="noopener noreferrer"
            href={`https://maps.google.com/?q=${encodeURIComponent(CONTACT.mapsQuery || CONTACT.address.replace(/\n/g, ', '))}`}>
            <div className="label"><MapPin width={14} height={14} strokeWidth={2} />Address</div>
            <div className="value" style={{ whiteSpace: 'pre-line' }}>{CONTACT.address}</div>
          </a>
          <div className="ct" style={{ cursor: 'default' }}>
            <div className="label"><Clock width={14} height={14} strokeWidth={2} />Hours</div>
            <div className="value">{CONTACT.hours}</div>
          </div>
        </div>

        <div className="map-wrap reveal">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(CONTACT.mapsQuery || CONTACT.address.replace(/\n/g, ', '))}&z=15&output=embed`}
            title={`Strike Print workshop — ${CONTACT.mapsQuery || CONTACT.address.replace(/\n/g, ', ')}`}
            loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
          <div className="map-overlay">
            <div className="addr">
              <MapPin width={16} height={16} strokeWidth={2.5} />
              {(CONTACT.mapsQuery || CONTACT.address.replace(/\n/g, ', '))}
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.mapsQuery || CONTACT.address.replace(/\n/g, ', '))}`}
              target="_blank" rel="noopener noreferrer">→ Get Directions</a>
          </div>
        </div>

        <div className="reviews-strip reveal">
          <div className="copy">
            <div className="title">{REVIEWS.title}</div>
            <div className="sub" style={{ whiteSpace: 'pre-line' }}>{REVIEWS.sub}</div>
          </div>
          <div className="stars">★ ★ ★ ★ ★</div>
          <a className="cta" href={REVIEWS.ctaUrl}
            target="_blank" rel="noopener noreferrer">{REVIEWS.ctaLabel}</a>
        </div>

        <div className="big-cta reveal">
          <div className="big-cta-glow" aria-hidden />
          <div className="big-cta-copy">
            <div className="eb">{BIG_CTA.eyebrow}</div>
            <h3>{BIG_CTA.title}</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{BIG_CTA.body}</p>
          </div>
          <a className="cta" style={{ fontSize: 18, padding: '18px 28px' }}
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>
            {BIG_CTA.ctaLabel} {CONTACT.phone}
          </a>
        </div>
      </section>

      <footer className="footer">
        <div>
          {FOOTER.tagline} · {year}
          {/* Subtle admin shortcut — Link does client-side routing so the
              lazy /admin chunk loads in-place without a full page reload. */}
          <Link to="/admin" className="admin-bolt" aria-label="Admin" title="Admin">
            <Zap width={11} height={11} strokeWidth={2.5} fill="currentColor" />
          </Link>
        </div>
        <div className="right">
          <a href="#contact">Contact</a>
          <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </div>
      </footer>

      {/* Lightbox */}
      {lightbox && lightbox.items[lightbox.idx] && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-counter">
            {String(lightbox.idx + 1).padStart(2, '0')} / {String(lightbox.items.length).padStart(2, '0')}
          </div>
          <button className="lightbox-btn lightbox-close" onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            aria-label="Close">
            <X width={20} height={20} strokeWidth={2.5} />
          </button>
          <button className="lightbox-btn lightbox-nav prev" onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
            aria-label="Previous">
            <ChevronLeft width={22} height={22} strokeWidth={2.5} />
          </button>
          <img className="lightbox-img" src={lightbox.items[lightbox.idx].src}
            alt={lightbox.items[lightbox.idx].label} onClick={closeLightbox} />
          <button className="lightbox-btn lightbox-nav next" onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
            aria-label="Next">
            <ChevronRight width={22} height={22} strokeWidth={2.5} />
          </button>
          <div className="lightbox-caption" onClick={(e) => e.stopPropagation()}>
            <span className="tick" />
            <span>{lightbox.items[lightbox.idx].label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
