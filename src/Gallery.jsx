import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { LOGO_URL } from './logo.js';
import { SHOWCASE_PHOTOS } from './Home.jsx';
import GetQuoteButton from './GetQuoteButton.jsx';
import MobileNavMenu from './MobileNavMenu.jsx';

// Same brand palette as Home — kept inline so Gallery doesn't pull anything
// extra from Home's component tree, just the photo data.
const BRAND = {
  navy:            '#012659',
  navyDeep:        '#08152e',
  navyRaise:       'rgba(15, 32, 70, 0.7)',
  navyLine:        'rgba(255, 255, 255, 0.08)',
  navyLineStrong:  'rgba(255, 255, 255, 0.15)',
  boltAmber:       '#f59a10',
  textPri:         '#f8fafc',
  textMuted:       '#cbd5e1',
  textDim:         '#94a3b8',
  textFaint:       '#64748b',
  boltGrad:        'linear-gradient(135deg, #f59a10, #f0601f, #fad905)'
};

// Items can be images today; videos slot into the same array as
// { kind: 'video', src, poster, label }. The render branches on `kind`.
const GALLERY_ITEMS = SHOWCASE_PHOTOS.map(p => ({ kind: 'image', ...p }));

// Group items by label, preserving the order they first appear in the array.
// Within each group, items keep their relative order from SHOWCASE_PHOTOS.
const GROUPS = (() => {
  const map = new Map();
  for (const item of GALLERY_ITEMS) {
    if (!map.has(item.label)) map.set(item.label, []);
    map.get(item.label).push(item);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
})();

const TOTAL_COUNT = GALLERY_ITEMS.length;

export default function Gallery() {
  // Lightbox now tracks WHICH GROUP it's traversing — prev/next stay within
  // that group instead of jumping across the whole gallery.
  // Shape: null | { items: [...], idx: number, label: string }
  const [lightbox, setLightbox] = useState(null);

  const openLightbox = useCallback((groupItems, label, idx) => {
    setLightbox({ items: groupItems, label, idx });
  }, []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() => {
    setLightbox(lb => lb ? { ...lb, idx: (lb.idx - 1 + lb.items.length) % lb.items.length } : lb);
  }, []);
  const next = useCallback(() => {
    setLightbox(lb => lb ? { ...lb, idx: (lb.idx + 1) % lb.items.length } : lb);
  }, []);

  // Keyboard nav for the lightbox
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape')          closeLightbox();
      else if (e.key === 'ArrowLeft')  prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, closeLightbox, prev, next]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (lightbox) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prevOverflow; };
    }
  }, [lightbox]);

  // Load fonts + animation styles (mirrors Home so this page isn't bare on direct load)
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id = 'strikeprint-gallery-styles';
    style.textContent = `
      @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fadeUp   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .anim-fadein { animation: fadeIn 0.6s ease-out both; }
      .anim-fadeup { animation: fadeUp 0.5s cubic-bezier(.2,.7,.3,1) both; }
      .lift { transition: transform 0.3s cubic-bezier(.2,.7,.3,1), border-color 0.3s ease, box-shadow 0.3s ease; }
      .lift:hover { transform: translateY(-3px); }

      .gal-card {
        transition: transform 0.4s cubic-bezier(.2,.7,.3,1), border-color 0.4s ease, box-shadow 0.4s ease;
        cursor: pointer;
      }
      .gal-card:hover {
        transform: translateY(-4px);
        border-color: ${BRAND.boltAmber};
        box-shadow: 0 16px 40px rgba(0,0,0,0.4);
      }
      .gal-img {
        transition: transform 0.6s cubic-bezier(.2,.7,.3,1), filter 0.4s ease;
        filter: saturate(0.95) brightness(0.95);
      }
      .gal-card:hover .gal-img {
        transform: scale(1.05);
        filter: saturate(1.05) brightness(1);
      }
    `;
    document.head.appendChild(style);
    return () => {
      try { document.head.removeChild(link); } catch {}
      try { document.head.removeChild(style); } catch {}
    };
  }, []);

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      minHeight: '100vh',
      color: BRAND.textPri,
      background: `radial-gradient(ellipse at top left, rgba(245,154,16,0.08), transparent 60%),
                   linear-gradient(180deg, ${BRAND.navyDeep} 0%, ${BRAND.navy} 100%)`
    }}>
      {/* Header — same construction as Home */}
      <header className="sticky top-0 z-40 backdrop-blur"
        style={{ background: 'rgba(8, 21, 46, 0.78)', borderBottom: `1px solid ${BRAND.navyLine}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3" title="Back to Strike Print home">
            <img src={LOGO_URL} alt="Strike Print" className="h-16 sm:h-24 w-auto" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/" className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.18em] hover:text-amber-400 transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textMuted }}>
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              Home
            </Link>
            <GetQuoteButton className="ml-1" />
            <MobileNavMenu />
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page heading */}
        <h1 className="anim-fadeup text-center" style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(2rem, 7vw, 3.25rem)',
          letterSpacing: '0.02em',
          lineHeight: 1
        }}>
          What <span style={{ color: BRAND.boltAmber }}>We've</span> Made
        </h1>
        <p className="anim-fadeup mt-3 max-w-2xl mx-auto text-center text-sm sm:text-base leading-relaxed" style={{ color: BRAND.textMuted }}>
          Real installs from across Sydney, grouped by sign type. Tap any image
          to see it larger — arrows or your keyboard cycle through that group.
        </p>

        {/* Groups — each section has its own heading + grid + lightbox scope */}
        <div className="mt-10 sm:mt-14 space-y-12 sm:space-y-16">
          {GROUPS.map(group => (
            <GalleryGroup key={group.label} group={group} onOpen={openLightbox} />
          ))}
        </div>

        <p className="mt-12 text-center text-[11px] uppercase tracking-[0.25em]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
          More photos and videos added regularly · {TOTAL_COUNT} shown across {GROUPS.length} categories
        </p>
      </main>

      {/* Lightbox modal — cycles within the active group only */}
      {lightbox && lightbox.items[lightbox.idx] && (
        <Lightbox
          item={lightbox.items[lightbox.idx]}
          idx={lightbox.idx}
          total={lightbox.items.length}
          groupLabel={lightbox.label}
          onClose={closeLightbox}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}

function GalleryGroup({ group, onOpen }) {
  return (
    <section>
      <div className="flex items-center justify-center gap-3 mb-5 anim-fadeup">
        <span className="h-px w-10 sm:w-16" style={{ background: BRAND.boltGrad }} />
        <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
          {group.label}
        </span>
        <span className="text-[10px] uppercase tracking-[0.25em]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
          · {group.items.length}
        </span>
        <span className="h-px w-10 sm:w-16" style={{ background: BRAND.boltGrad }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {group.items.map((it, idx) => (
          <GalleryCard key={idx} item={it} idx={idx}
            onOpen={() => onOpen(group.items, group.label, idx)} />
        ))}
      </div>
    </section>
  );
}

function GalleryCard({ item, idx, onOpen }) {
  return (
    <button type="button" onClick={onOpen}
      className="gal-card relative overflow-hidden block w-full"
      style={{
        aspectRatio: '4 / 3',
        background: BRAND.navyDeep,
        border: `1px solid ${BRAND.navyLineStrong}`,
        cursor: 'pointer'
      }}>
      <img src={item.src} alt={item.label}
        loading={idx < 4 ? 'eager' : 'lazy'}
        decoding="async"
        className="gal-img absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover' }} />
    </button>
  );
}

function Lightbox({ item, idx, total, groupLabel, onClose, onPrev, onNext }) {
  // Portal to body — the sticky header has backdrop-filter which creates a
  // containing block for fixed positioning, so without the portal the
  // 'fixed inset-0' overlay would be trapped inside the header bounds.
  return ReactDOM.createPortal(
    <div onClick={onClose}
      className="anim-fadein fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(8,21,46,0.92)',
        backdropFilter: 'blur(8px)',
        color: BRAND.textPri,
        fontFamily: "'Outfit', sans-serif"
      }}>
      {/* Close (top-right of viewport) */}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }}
        title="Close (Esc)"
        className="lift fixed top-3 right-3 sm:top-5 sm:right-5 z-10 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11"
        style={{
          background: 'rgba(8,21,46,0.85)',
          border: `1px solid ${BRAND.navyLineStrong}`,
          color: BRAND.textPri
        }}>
        <X className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Prev (left) — disabled if only one item in group */}
      {total > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
          title="Previous (←)"
          className="lift fixed left-2 sm:left-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12"
          style={{
            background: 'rgba(8,21,46,0.85)',
            border: `1px solid ${BRAND.navyLineStrong}`,
            color: BRAND.textPri
          }}>
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>
      )}

      {/* Next (right) */}
      {total > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }}
          title="Next (→)"
          className="lift fixed right-2 sm:right-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12"
          style={{
            background: 'rgba(8,21,46,0.85)',
            border: `1px solid ${BRAND.navyLineStrong}`,
            color: BRAND.textPri
          }}>
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>
      )}

      {/* Image + meta */}
      <div onClick={(e) => e.stopPropagation()} className="relative max-w-6xl w-full anim-fadeup">
        {item.kind === 'video' ? (
          <video src={item.src} poster={item.poster} controls autoPlay
            className="block w-full max-h-[78vh] mx-auto"
            style={{ background: BRAND.navyDeep, border: `1px solid ${BRAND.boltAmber}` }} />
        ) : (
          <img src={item.src} alt={item.label}
            className="block w-full max-h-[78vh] mx-auto object-contain"
            style={{ background: BRAND.navyDeep, border: `1px solid ${BRAND.boltAmber}` }} />
        )}
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="h-px w-4" style={{ background: BRAND.boltAmber }} />
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.22em] font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textPri }}>
              {groupLabel}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em]"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
            {idx + 1} / {total} in group
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
