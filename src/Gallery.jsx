import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { LOGO_URL } from './logo.js';
import { SHOWCASE_PHOTOS } from './Home.jsx';

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

// All distinct labels become filter chips.
const CATEGORIES = ['All', ...Array.from(new Set(GALLERY_ITEMS.map(i => i.label)))];

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Filtered list — drives both the grid and lightbox navigation
  const items = activeFilter === 'All'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(i => i.label === activeFilter);

  // Reset lightbox when filter changes (the indices no longer line up)
  useEffect(() => { setLightboxIdx(null); }, [activeFilter]);

  // Keyboard nav for the lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape')      setLightboxIdx(null);
      else if (e.key === 'ArrowLeft')  setLightboxIdx(i => (i - 1 + items.length) % items.length);
      else if (e.key === 'ArrowRight') setLightboxIdx(i => (i + 1) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, items.length]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (lightboxIdx !== null) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [lightboxIdx]);

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

  const openLightbox = useCallback((idx) => setLightboxIdx(idx), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prev = useCallback(() => setLightboxIdx(i => (i - 1 + items.length) % items.length), [items.length]);
  const next = useCallback(() => setLightboxIdx(i => (i + 1) % items.length), [items.length]);

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
            <Link to="/quote"
              className="ml-1 inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.18em] font-bold"
              style={{
                background: BRAND.boltGrad,
                color: BRAND.navy,
                fontFamily: 'Anton, sans-serif',
                letterSpacing: '0.1em'
              }}>
              <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
              Get a Quote
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Section header */}
        <h1 className="anim-fadeup" style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(2rem, 7vw, 3.25rem)',
          letterSpacing: '0.02em',
          lineHeight: 1
        }}>
          What <span style={{ color: BRAND.boltAmber }}>We've</span> Made
        </h1>
        <p className="anim-fadeup mt-3 max-w-2xl text-sm sm:text-base leading-relaxed" style={{ color: BRAND.textMuted }}>
          Real installs from across Sydney. Tap any image to see it larger — use the
          arrows or your keyboard to flick through.
        </p>

        {/* Filter chips */}
        <div className="anim-fadeup mt-6 sm:mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const isActive = cat === activeFilter;
            return (
              <button key={cat} onClick={() => setActiveFilter(cat)}
                className="lift px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: isActive ? BRAND.boltGrad : 'rgba(8,21,46,0.6)',
                  color: isActive ? BRAND.navy : BRAND.textPri,
                  border: `1px solid ${isActive ? 'transparent' : BRAND.navyLineStrong}`,
                  fontWeight: isActive ? 700 : 500
                }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {items.map((it, idx) => (
            <GalleryCard key={`${activeFilter}-${idx}`} item={it} idx={idx} onOpen={openLightbox} />
          ))}
        </div>

        {/* Hint that more is coming */}
        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.25em]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
          More photos and videos added regularly · {items.length} {activeFilter === 'All' ? 'shown' : `tagged "${activeFilter}"`}
        </p>
      </main>

      {/* Lightbox modal */}
      {lightboxIdx !== null && items[lightboxIdx] && (
        <Lightbox
          item={items[lightboxIdx]}
          idx={lightboxIdx}
          total={items.length}
          onClose={closeLightbox}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}

function GalleryCard({ item, idx, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(idx)}
      className="gal-card relative overflow-hidden block w-full"
      style={{
        aspectRatio: '4 / 3',
        background: BRAND.navyDeep,
        border: `1px solid ${BRAND.navyLineStrong}`,
        cursor: 'pointer'
      }}>
      <img src={item.src} alt={item.label}
        loading={idx < 8 ? 'eager' : 'lazy'}
        decoding="async"
        className="gal-img absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover' }} />
      <div className="absolute inset-x-0 bottom-0 px-3 py-2 flex items-center gap-2"
        style={{ background: 'linear-gradient(to top, rgba(8,21,46,0.95), rgba(8,21,46,0.6) 60%, transparent)' }}>
        <span className="h-px w-3" style={{ background: BRAND.boltAmber }} />
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textPri }}>
          {item.label}
        </span>
      </div>
    </button>
  );
}

function Lightbox({ item, idx, total, onClose, onPrev, onNext }) {
  // Tap-on-backdrop closes; clicks on the image / controls don't propagate
  return (
    <div onClick={onClose}
      className="anim-fadein fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(8,21,46,0.92)', backdropFilter: 'blur(8px)' }}>
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

      {/* Prev (left) */}
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

      {/* Next (right) */}
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
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-px w-4" style={{ background: BRAND.boltAmber }} />
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.22em] font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textPri }}>
              {item.label}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em]"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
            {idx + 1} / {total}
          </span>
        </div>
      </div>
    </div>
  );
}
