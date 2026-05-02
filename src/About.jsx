import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, ArrowRight, Video } from 'lucide-react';
import { LOGO_URL } from './logo.js';
import GetQuoteButton from './GetQuoteButton.jsx';
import MobileNavMenu from './MobileNavMenu.jsx';

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

const PILLARS = [
  { k: 'Materials', v: 'ACM, acrylic, vinyl, fabric, LEDs — only what we trust on a real install.' },
  { k: 'Install',   v: 'Licensed and insured. Heritage zones, council permits, lift hire — handled.' },
  { k: 'Design',    v: 'Bring your own artwork or let us lay it out — bring it from idea to wall.' },
  { k: 'Aftercare', v: 'Sign needs work? We come back. We stand behind every install.' }
];

// Drop video files into public/videos/ and add entries here. The renderer
// uses native <video> with controls + poster, so any standard mp4/webm works.
//
//   Example:
//   { src: '/videos/install-timelapse.mp4', poster: '/portfolio/install-04.webp', label: 'Office signage timelapse' }
const VIDEOS = [];

export default function About() {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id = 'strikeprint-about-styles';
    style.textContent = `
      @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fadeUp   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .anim-fadein { animation: fadeIn 0.6s ease-out both; }
      .anim-fadeup { animation: fadeUp 0.5s cubic-bezier(.2,.7,.3,1) both; }
      .lift { transition: transform 0.3s cubic-bezier(.2,.7,.3,1), border-color 0.3s ease, box-shadow 0.3s ease; }
      .lift:hover { transform: translateY(-3px); }
      .stagger-1 { animation-delay: 80ms; }
      .stagger-2 { animation-delay: 160ms; }
      .stagger-3 { animation-delay: 240ms; }
      .stagger-4 { animation-delay: 320ms; }
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
        {/* Eyebrow */}
        <div className="anim-fadein flex items-center justify-center gap-3 mb-5 flex-wrap">
          <span className="h-px w-10 sm:w-16" style={{ background: BRAND.boltGrad }} />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-bold"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            About Strike Print
          </span>
          <span className="h-px w-10 sm:w-16" style={{ background: BRAND.boltGrad }} />
        </div>

        {/* Title */}
        <h1 className="anim-fadeup mb-6" style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(2.25rem, 8vw, 4rem)',
          letterSpacing: '0.02em',
          lineHeight: 1.05
        }}>
          Custom signage, <span style={{ color: BRAND.boltAmber }}>built to last</span>.
        </h1>

        {/* Body */}
        <div className="anim-fadeup stagger-1 max-w-3xl mx-auto space-y-5">
          <p className="text-base sm:text-lg lg:text-xl leading-relaxed" style={{ color: BRAND.textPri }}>
            Strike Print is an Arndell Park signage installer serving Sydney and beyond.
            We design, manufacture and install custom signs that get businesses noticed
            and keep them looking sharp for years.
          </p>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: BRAND.textMuted }}>
            From a single shopfront fascia to a fleet vehicle rollout, every job runs
            the same way: clean specs, premium materials, careful install. We work with
            local trades, retail, hospitality, fitness, healthcare and corporate
            clients across Western Sydney.
          </p>
        </div>

        {/* Pillars — 4-up grid, content stays left-aligned inside cards for legibility */}
        <div className="grid sm:grid-cols-2 gap-3 mt-10 sm:mt-12 max-w-3xl mx-auto text-left">
          {PILLARS.map((p, i) => (
            <div key={p.k} className={`lift anim-fadeup stagger-${(i % 4) + 1} px-5 py-4`}
              style={{
                background: BRAND.navyRaise,
                border: `1px solid ${BRAND.navyLine}`,
                borderTop: `2px solid ${BRAND.boltAmber}`
              }}>
              <div className="text-[10px] uppercase tracking-[0.22em] mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                {p.k}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                {p.v}
              </div>
            </div>
          ))}
        </div>

        {/* Videos */}
        <div className="mt-14 sm:mt-20">
          <div className="anim-fadein flex items-center justify-center gap-3 mb-5 flex-wrap">
            <span className="h-px w-10 sm:w-16" style={{ background: BRAND.boltGrad }} />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-bold"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
              Videos
            </span>
            <span className="h-px w-10 sm:w-16" style={{ background: BRAND.boltGrad }} />
          </div>

          {VIDEOS.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {VIDEOS.map((v, i) => (
                <div key={v.src} className="lift relative overflow-hidden anim-fadeup"
                  style={{
                    background: BRAND.navyDeep,
                    border: `1px solid ${BRAND.navyLineStrong}`,
                    aspectRatio: '16/9'
                  }}>
                  <video src={v.src} poster={v.poster} controls preload="metadata"
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'cover' }} />
                  {v.label && (
                    <div className="absolute inset-x-0 bottom-0 px-4 py-2 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, rgba(8,21,46,0.95), transparent)' }}>
                      <span className="text-[10px] uppercase tracking-[0.22em] font-bold"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textPri }}>
                        {v.label}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Empty-state placeholder until Mick uploads videos
            <div className="mx-auto max-w-2xl px-6 py-10 flex flex-col items-center gap-3 anim-fadeup"
              style={{
                background: 'rgba(15, 32, 70, 0.4)',
                border: `1px dashed ${BRAND.navyLineStrong}`
              }}>
              <Video className="w-10 h-10" style={{ color: BRAND.boltAmber }} strokeWidth={1.5} />
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', letterSpacing: '0.03em' }}>
                Videos coming soon
              </div>
              <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                Install timelapses, fabrication clips and behind-the-scenes from the workshop.
                Drop in regularly — we add new ones often.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Link to="/quote"
            className="group inline-flex items-center justify-center gap-3 px-6 py-4"
            style={{
              background: BRAND.boltGrad,
              color: BRAND.navy,
              fontFamily: 'Anton, sans-serif',
              letterSpacing: '0.1em'
            }}>
            <Send className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-base sm:text-lg">Get an Instant Quote</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/gallery"
            className="lift inline-flex items-center justify-center gap-2 px-6 py-4 text-sm sm:text-base uppercase tracking-[0.15em]"
            style={{
              fontFamily: 'Anton, sans-serif',
              background: 'transparent',
              border: `1px solid ${BRAND.navyLineStrong}`,
              color: BRAND.textPri
            }}>
            See Our Work
          </Link>
        </div>
      </main>
    </div>
  );
}
