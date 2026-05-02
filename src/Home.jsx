import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Wrench, Send, ChevronRight, ArrowRight, Phone, Mail, MapPin, Clock,
  Square, Car, Flag, Lightbulb, EyeOff, Navigation
} from 'lucide-react';
import { LOGO_URL } from './logo.js';

// Brand palette mirrors the quote tool — navy ground with bolt-orange and amber accents.
const BRAND = {
  navy:            '#012659',
  navyDeep:        '#08152e',
  navyCard:        'rgba(8, 21, 46, 0.95)',
  navyRaise:       'rgba(15, 32, 70, 0.7)',
  navyLine:        'rgba(255, 255, 255, 0.08)',
  navyLineStrong:  'rgba(255, 255, 255, 0.15)',
  boltOrange:      '#f0601f',
  boltAmber:       '#f59a10',
  boltYellow:      '#fad905',
  textPri:         '#f8fafc',
  textMuted:       '#cbd5e1',
  textDim:         '#94a3b8',
  textFaint:       '#64748b',
  boltGrad:        'linear-gradient(135deg, #f59a10, #f0601f, #fad905)'
};

// ═══════════════════════════════════════════════════════════════
//   SERVICES — marketing-facing grouping of what Strike Print does.
//   Stay in sync with the quote tool's SIGN_CATALOGUE in spirit but
//   the wording here is for storytelling, not pricing.
// ═══════════════════════════════════════════════════════════════
const SERVICES = [
  {
    icon: Square,
    title: 'Shopfront & Building Signs',
    blurb: 'ACM panels, fascias and storefront signage. Custom digital print on aluminium composite — engineered for kerb appeal that holds up under sun and weather.'
  },
  {
    icon: Lightbulb,
    title: 'Illuminated Signs',
    blurb: 'Lightboxes, channel letters and halo-lit cabinets. Internally LED-lit so your sign reads as clearly at midnight as it does at noon.'
  },
  {
    icon: Car,
    title: 'Vehicle Wraps & Decals',
    blurb: 'Door logos, panel decals, full wraps. Vans, trucks, fleet — turn the asset you already own into a mobile billboard.'
  },
  {
    icon: Flag,
    title: 'Banners, Flags & A-Frames',
    blurb: 'Heavy-duty PVC banners, feather flags and footpath A-frames. Quick-turn marketing for events, sales and seasonal campaigns.'
  },
  {
    icon: EyeOff,
    title: 'Windows & Wall Graphics',
    blurb: 'Vinyl window graphics, frosted privacy film, large-format wall murals. Brand presence and privacy in equal measure.'
  },
  {
    icon: Navigation,
    title: 'Pylons & Wayfinding',
    blurb: 'Free-standing roadside pylons and compact directional signs. Premium visibility for service stations, centres and campus navigation.'
  }
];


// ═══════════════════════════════════════════════════════════════
//   PAGE
// ═══════════════════════════════════════════════════════════════
export default function Home() {
  // Load fonts + animations on mount. Mirrors the SignageQuote setup so the
  // typography stays consistent between marketing and tool.
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id = 'strikeprint-home-styles';
    style.textContent = `
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideInL { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes pulseGlow { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
      @keyframes glossySweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      @keyframes serviceProgress { 0% { width: 0%; } 100% { width: 100%; } }
      .anim-fadeup { animation: fadeInUp 0.7s ease-out both; }
      .anim-fadein { animation: fadeIn 1.2s ease-out both; }
      .anim-slidel { animation: slideInL 0.8s ease-out both; }
      .anim-pulse  { animation: pulseGlow 3.5s ease-in-out infinite; }
      .stagger-1 { animation-delay: 80ms; }
      .stagger-2 { animation-delay: 160ms; }
      .stagger-3 { animation-delay: 240ms; }
      .stagger-4 { animation-delay: 320ms; }
      .stagger-5 { animation-delay: 400ms; }
      .stagger-6 { animation-delay: 480ms; }

      .lift { transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out; }
      .lift:hover { transform: translateY(-2px); }

      .glossy-btn { position: relative; overflow: hidden; }
      .glossy-btn::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%);
        transform: translateX(-100%);
      }
      .glossy-btn:hover::before { animation: glossySweep 0.9s ease-out forwards; }

      /* Showcase marquee — continuous horizontal scroll, hover-pause + lift */
      @keyframes marqueeScroll {
        0%   { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(-50%, 0, 0); }
      }
      .showcase-track { animation: marqueeScroll 180s linear infinite; will-change: transform; }
      .showcase-track:hover { animation-play-state: paused; }
      .showcase-mask {
        -webkit-mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
                mask-image: linear-gradient(to right, transparent 0, black 4%, black 96%, transparent 100%);
      }
      .showcase-card {
        transition: transform 0.45s cubic-bezier(.2,.7,.3,1),
                    border-color 0.45s ease,
                    box-shadow 0.45s ease;
      }
      .showcase-card:hover {
        transform: translateY(-6px);
        border-color: ${BRAND.boltAmber};
        box-shadow: 0 18px 50px rgba(0,0,0,0.45), 0 0 0 1px ${BRAND.boltAmber};
        z-index: 1;
      }
      .showcase-img {
        transition: transform 1.2s cubic-bezier(.2,.7,.3,1), filter 0.6s ease;
        filter: saturate(0.92) brightness(0.92);
      }
      .showcase-card:hover .showcase-img {
        transform: scale(1.06);
        filter: saturate(1.05) brightness(1);
      }
      .showcase-label {
        transform: translateY(35%);
        opacity: 0.8;
        transition: transform 0.45s cubic-bezier(.2,.7,.3,1), opacity 0.45s ease;
      }
      .showcase-card:hover .showcase-label {
        transform: translateY(0);
        opacity: 1;
      }
      @media (prefers-reduced-motion: reduce) {
        .showcase-track { animation: none; }
        .showcase-img, .showcase-label, .showcase-card { transition: none; }
      }

      html { scroll-behavior: smooth; }
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
      background: `radial-gradient(ellipse at top left, rgba(245,154,16,0.10), transparent 60%),
                   radial-gradient(ellipse at bottom right, rgba(240,96,31,0.08), transparent 60%),
                   linear-gradient(180deg, ${BRAND.navyDeep} 0%, ${BRAND.navy} 100%)`
    }}>
      <Header />
      <Hero />
      <Services />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//   HEADER
// ═══════════════════════════════════════════════════════════════
function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur"
      style={{
        background: 'rgba(8, 21, 46, 0.78)',
        borderBottom: `1px solid ${BRAND.navyLine}`
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Strike Print" className="h-16 sm:h-24 w-auto" />
          <div className="hidden sm:block">
            <div className="leading-tight font-bold" style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.04em', fontSize: '20px' }}>
              STRIKE PRINT
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
              Premium signage installed
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#services" className="hidden md:inline-block px-3 py-2 text-[11px] uppercase tracking-[0.18em] hover:text-amber-400 transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textMuted }}>
            Services
          </a>
          <Link to="/gallery" className="hidden md:inline-block px-3 py-2 text-[11px] uppercase tracking-[0.18em] hover:text-amber-400 transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textMuted }}>
            Gallery
          </Link>
          <a href="#contact" className="hidden md:inline-block px-3 py-2 text-[11px] uppercase tracking-[0.18em] hover:text-amber-400 transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textMuted }}>
            Contact
          </a>
          <Link to="/quote"
            className="glossy-btn ml-1 inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.18em] font-bold"
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
  );
}

// ═══════════════════════════════════════════════════════════════
//   HERO
// ═══════════════════════════════════════════════════════════════
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background grid + glow */}
      <div className="absolute inset-0 pointer-events-none anim-pulse" aria-hidden style={{
        background: `radial-gradient(ellipse 800px 320px at 50% 30%, rgba(245,154,16,0.18), transparent 70%)`,
        filter: 'blur(40px)'
      }} />

      {/* Top: eyebrow + headline + sub-tagline */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-24 lg:pt-32">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-5 anim-fadein">
          <span className="h-px w-10 sm:w-16" style={{ background: BRAND.boltGrad }} />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-bold"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            Sydney · Arndell Park · Est. signage installer
          </span>
        </div>

        {/* Headline */}
        <h1 className="anim-fadeup leading-[0.92] mb-6"
          style={{
            fontFamily: 'Anton, sans-serif',
            letterSpacing: '0.01em',
            fontSize: 'clamp(2.75rem, 9vw, 6.5rem)'
          }}>
          STAND OUT WITH
          <br />
          <span style={{
            background: BRAND.boltGrad,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>STRIKING SIGNAGE</span>
        </h1>

        {/* Sub-tagline */}
        <p className="anim-fadeup stagger-1 max-w-2xl text-base sm:text-lg lg:text-xl leading-relaxed"
          style={{ color: BRAND.textMuted }}>
          Custom signs, banners, decals, vehicle wraps and pylons. Designed,
          manufactured and installed in Western Sydney — built to get noticed and
          built to last.
        </p>
      </div>

      {/* Recent work showcase — sits between the sub-tagline and the CTAs,
          full-bleed across the section so the marquee runs edge-to-edge. */}
      <Showcase />

      {/* Bottom: CTAs */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-10 sm:pb-24 lg:pb-32">
        {/* CTAs */}
        <div className="anim-fadeup stagger-2 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link to="/quote"
            className="glossy-btn group inline-flex items-center justify-between gap-3 px-6 py-5"
            style={{
              background: BRAND.boltGrad,
              color: BRAND.navy,
              fontFamily: 'Anton, sans-serif',
              letterSpacing: '0.1em'
            }}>
            <span className="flex items-center gap-3">
              <Wrench className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-base sm:text-xl">Get an Instant Quote</span>
            </span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/gallery"
            className="lift inline-flex items-center justify-center gap-2 px-6 py-5 text-sm sm:text-base uppercase tracking-[0.15em]"
            style={{
              fontFamily: 'Anton, sans-serif',
              background: 'transparent',
              border: `1px solid ${BRAND.navyLineStrong}`,
              color: BRAND.textPri
            }}>
            See What We Do
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//   SERVICES
// ═══════════════════════════════════════════════════════════════
function Services() {
  return (
    <section id="services" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <SectionHeader num="01" title="What We Make" />
      <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed" style={{ color: BRAND.textMuted }}>
        We use premium materials on every job — <strong style={{ color: BRAND.textPri }}>Avery</strong>,{' '}
        <strong style={{ color: BRAND.textPri }}>3M</strong> and{' '}
        <strong style={{ color: BRAND.textPri }}>Arlon</strong> cast vinyl films, ACM, acrylic and aluminium,
        finished with UV-stable inks rated for years of Australian sun. Every sign we hang is built to last.
      </p>

      <ServiceCarousel />


      <div className="mt-10 flex justify-center">
        <Link to="/quote"
          className="glossy-btn group inline-flex items-center gap-3 px-6 py-4"
          style={{
            background: BRAND.boltGrad,
            color: BRAND.navy,
            fontFamily: 'Anton, sans-serif',
            letterSpacing: '0.1em'
          }}>
          <Wrench className="w-5 h-5" strokeWidth={2.5} />
          <span className="text-base sm:text-lg">Quote Any Of These In 60 Seconds</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//   SERVICE CAROUSEL — single rotating card. Auto-cycles every ~5s,
//   crossfades between entries, pauses on hover, dot navigation.
// ═══════════════════════════════════════════════════════════════
const SERVICE_CYCLE_MS = 5200;

function ServiceCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActiveIdx(i => (i + 1) % SERVICES.length);
    }, SERVICE_CYCLE_MS);
    return () => clearInterval(id);
  }, [paused]);

  const goTo = (i) => setActiveIdx(((i % SERVICES.length) + SERVICES.length) % SERVICES.length);

  return (
    <div className="mt-8 sm:mt-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}>
      <div className="relative overflow-hidden"
        style={{
          background: BRAND.navyRaise,
          border: `1px solid ${BRAND.navyLineStrong}`,
          backdropFilter: 'blur(8px)',
          minHeight: 'clamp(260px, 36vw, 320px)'
        }}>
        {/* Top-right amber corner accent — same as the old card */}
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none" aria-hidden style={{
          background: `linear-gradient(225deg, ${BRAND.boltAmber}30, transparent 60%)`
        }} />

        {/* Bottom progress bar — fills over the cycle duration, resets on change */}
        <div className="absolute left-0 right-0 bottom-0 h-[3px]" aria-hidden
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div key={`bar-${activeIdx}-${paused ? 'p' : 'r'}`}
            className="h-full"
            style={{
              background: BRAND.boltGrad,
              animation: paused ? 'none' : `serviceProgress ${SERVICE_CYCLE_MS}ms linear forwards`,
              width: paused ? '100%' : '0%',
              opacity: paused ? 0.4 : 1
            }} />
        </div>

        {/* Stack of cards — only the active one is visible. Each fades + slides
            in from the right when activated, fades out left when deactivated. */}
        {SERVICES.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === activeIdx;
          return (
            <div key={s.title}
              aria-hidden={!isActive}
              className="absolute inset-0 p-5 sm:p-7 lg:p-9 flex flex-col sm:flex-row gap-4 sm:gap-7"
              style={{
                opacity: isActive ? 1 : 0,
                transform: `translateX(${isActive ? 0 : 24}px)`,
                transition: 'opacity 550ms cubic-bezier(.2,.7,.3,1), transform 550ms cubic-bezier(.2,.7,.3,1)',
                pointerEvents: isActive ? 'auto' : 'none'
              }}>
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20"
                  style={{ background: BRAND.navyDeep, border: `1px solid ${BRAND.boltAmber}40`, color: BRAND.boltAmber }}>
                  <Icon className="w-7 h-7 sm:w-9 sm:h-9" strokeWidth={2} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.25em] mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
                  Service · {String(i + 1).padStart(2, '0')} / {String(SERVICES.length).padStart(2, '0')}
                </div>
                <h3 className="mb-3" style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 'clamp(1.5rem, 4.5vw, 2.4rem)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.05
                }}>
                  {s.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: BRAND.textMuted }}>
                  {s.blurb}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot navigation — active dot stretches into a bar */}
      <div className="flex items-center justify-center gap-1.5 mt-4 sm:mt-5">
        {SERVICES.map((s, i) => {
          const isActive = i === activeIdx;
          return (
            <button key={s.title} onClick={() => goTo(i)}
              aria-label={`Show ${s.title}`}
              className="transition-all duration-500 cursor-pointer"
              style={{
                width: isActive ? '32px' : '8px',
                height: '4px',
                background: isActive ? BRAND.boltGrad : BRAND.navyLineStrong,
                border: 'none',
                padding: 0
              }} />
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//   ABOUT
// ═══════════════════════════════════════════════════════════════
function About() {
  return (
    <section id="about" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-2">
          <SectionHeader num="03" title="About" />
        </div>
        <div className="lg:col-span-3 space-y-5 anim-fadeup">
          <p className="text-lg sm:text-xl leading-relaxed" style={{ color: BRAND.textPri }}>
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
          <div className="grid sm:grid-cols-2 gap-3 pt-4">
            {[
              { k: 'Materials', v: 'ACM, acrylic, vinyl, fabric, LEDs — only what we trust on a real install.' },
              { k: 'Install',   v: 'Licensed and insured. Heritage zones, council permits, lift hire — handled.' },
              { k: 'Design',    v: 'Bring your own artwork or let us lay it out — bring it from idea to wall.' },
              { k: 'Aftercare', v: 'Sign needs work? We come back. We stand behind every install.' }
            ].map(p => (
              <div key={p.k} className="px-4 py-3"
                style={{ background: BRAND.navyRaise, border: `1px solid ${BRAND.navyLine}`, borderTop: `2px solid ${BRAND.boltAmber}` }}>
                <div className="text-[10px] uppercase tracking-[0.22em] mb-1.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  {p.k}
                </div>
                <div className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
                  {p.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//   CONTACT
// ═══════════════════════════════════════════════════════════════
function Contact() {
  const items = [
    { icon: Phone,  label: 'Phone',   value: '0422 626 286',                    href: 'tel:0422626286' },
    { icon: Mail,   label: 'Email',   value: 'info@strikeprint.com.au',         href: 'mailto:info@strikeprint.com.au' },
    { icon: MapPin, label: 'Address', value: '26/70 Holbeche Rd, Arndell Park NSW 2148', href: 'https://maps.google.com/?q=26/70+Holbeche+Rd+Arndell+Park+NSW+2148' },
    { icon: Clock,  label: 'Hours',   value: 'Mon–Fri · 8am–4pm', href: null }
  ];

  return (
    <section id="contact" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <SectionHeader num="04" title="Get In Touch" />
      <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed" style={{ color: BRAND.textMuted }}>
        Quote tool not your speed? Call, email, or drop in to the Arndell Park
        workshop — we're happy to chat through anything.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10">
        {items.map((it, i) => {
          const Inner = it.href ? 'a' : 'div';
          return (
            <Inner key={it.label} {...(it.href ? { href: it.href, target: it.href.startsWith('http') ? '_blank' : undefined, rel: 'noopener noreferrer' } : {})}
              className={`lift anim-fadeup stagger-${i + 1} p-5 block`}
              style={{
                background: BRAND.navyRaise,
                border: `1px solid ${BRAND.navyLineStrong}`,
                color: BRAND.textPri,
                textDecoration: 'none'
              }}>
              <div className="flex items-center gap-2.5 mb-3">
                <it.icon className="w-4 h-4" style={{ color: BRAND.boltAmber }} strokeWidth={2} />
                <span className="text-[10px] uppercase tracking-[0.25em]"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
                  {it.label}
                </span>
              </div>
              <div className="text-sm sm:text-base leading-snug" style={{ color: BRAND.textPri, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                {it.value}
              </div>
            </Inner>
          );
        })}
      </div>

      {/* Google Maps embed — Arndell Park workshop */}
      <ShopMap />

      {/* Big CTA at the bottom of contact */}
      <div className="mt-10 sm:mt-12 relative overflow-hidden p-6 sm:p-10"
        style={{
          background: BRAND.navyDeep,
          border: `1px solid ${BRAND.boltAmber}40`,
          borderLeft: `4px solid ${BRAND.boltAmber}`
        }}>
        <div className="absolute inset-0 anim-pulse pointer-events-none" aria-hidden style={{
          background: `radial-gradient(ellipse 500px 200px at 80% 50%, rgba(245,154,16,0.15), transparent 70%)`
        }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.25em] mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
              Skip the back-and-forth
            </div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', letterSpacing: '0.02em', lineHeight: 1.05 }}>
              Get a real quote. Right now.
            </div>
            <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: BRAND.textMuted }}>
              Upload a photo, drag the signs you want, send it through. We'll come back
              with final pricing and a site-survey timeline.
            </p>
          </div>
          <Link to="/quote"
            className="glossy-btn group inline-flex items-center gap-3 px-5 sm:px-6 py-4 sm:py-5 flex-shrink-0"
            style={{
              background: BRAND.boltGrad,
              color: BRAND.navy,
              fontFamily: 'Anton, sans-serif',
              letterSpacing: '0.1em'
            }}>
            <Send className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-base sm:text-xl">Start Quote</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
//   SHOP MAP — Google Maps iframe of the Arndell Park workshop.
//   Uses the public ?q=&output=embed URL — no API key, no quota.
// ═══════════════════════════════════════════════════════════════
const SHOP_ADDRESS = '26/70 Holbeche Rd, Arndell Park NSW 2148';
const SHOP_MAPS_LINK = 'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(SHOP_ADDRESS);
const SHOP_MAPS_EMBED = 'https://maps.google.com/maps?q=' +
  encodeURIComponent(SHOP_ADDRESS) + '&z=15&output=embed';

function ShopMap() {
  return (
    <div className="anim-fadeup mt-6 sm:mt-8 relative overflow-hidden"
      style={{
        background: BRAND.navyDeep,
        border: `1px solid ${BRAND.navyLineStrong}`,
        borderTop: `2px solid ${BRAND.boltAmber}`
      }}>
      {/* The map itself. Slight grayscale + contrast bump so Google's
          default palette blends with the navy theme rather than fighting it. */}
      <iframe
        src={SHOP_MAPS_EMBED}
        title={`Strike Print workshop — ${SHOP_ADDRESS}`}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        style={{
          display: 'block',
          width: '100%',
          height: 'clamp(280px, 45vw, 440px)',
          border: 0,
          filter: 'grayscale(0.35) contrast(1.05)'
        }}
      />

      {/* Footer bar inside the frame: address + open-in-Maps shortcut */}
      <div className="absolute bottom-0 inset-x-0 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        style={{
          background: 'linear-gradient(to top, rgba(8,21,46,0.96), rgba(8,21,46,0.7) 70%, transparent)',
          pointerEvents: 'none'
        }}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: BRAND.boltAmber }} strokeWidth={2.5} />
          <span className="text-[11px] sm:text-xs tracking-wide" style={{ color: BRAND.textPri, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
            {SHOP_ADDRESS}
          </span>
        </div>
        <a href={SHOP_MAPS_LINK} target="_blank" rel="noopener noreferrer"
          className="lift inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] font-bold self-start sm:self-auto"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: BRAND.boltGrad,
            color: BRAND.navy,
            pointerEvents: 'auto'
          }}>
          <ArrowRight className="w-3 h-3" strokeWidth={3} />
          Get Directions
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//   FOOTER
// ═══════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 mt-8"
      style={{ borderTop: `1px solid ${BRAND.navyLine}` }}>
      <div className="flex flex-col sm:flex-row justify-between gap-4 text-[10px] uppercase tracking-widest"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Strike Print" className="h-6 w-auto opacity-60" />
          <span>Strike Print · Arndell Park NSW · {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#contact" style={{ color: BRAND.textFaint }} className="hover:text-amber-400 transition-colors">Contact</a>
          <Link to="/quote" style={{ color: BRAND.textFaint }} className="hover:text-amber-400 transition-colors">Quote tool</Link>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════
//   SHOWCASE — auto-scrolling portfolio marquee.
//   Edge-fade mask hides the seam at left/right viewport boundaries.
//   Hover pauses the scroll and lifts the focused card.
// ═══════════════════════════════════════════════════════════════
// 50 photos: 10 from the original strikeprint.com.au gallery plus 40 install
// photos pulled from Michael's archive. Each is hand-categorised and the order
// is shuffled so adjacent cards in the marquee aren't from the same job/site.
export const SHOWCASE_PHOTOS = [
  { src: '/portfolio/hero.webp',         label: 'Storefront signage' },
  { src: '/portfolio/install-01.webp',   label: 'Panels & acrylics' },
  { src: '/portfolio/install-08.webp',   label: 'Wall mural' },
  { src: '/portfolio/install-19.webp',   label: 'Storefront signage' },
  { src: '/portfolio/install-04.webp',   label: 'Wall graphics' },
  { src: '/portfolio/wall-1.webp',       label: 'Wall graphics' },
  { src: '/portfolio/install-32.webp',   label: 'Vehicle wrap' },
  { src: '/portfolio/install-09.webp',   label: 'Privacy film' },
  { src: '/portfolio/install-13.webp',   label: 'Wall graphics' },
  { src: '/portfolio/install-06.webp',   label: 'Lightbox' },
  { src: '/portfolio/privacy-1.webp',    label: 'Privacy film' },
  { src: '/portfolio/install-23.webp',   label: 'Wall mural' },
  { src: '/portfolio/install-17.webp',   label: 'Storefront signage' },
  { src: '/portfolio/install-39.webp',   label: 'Vending wrap' },
  { src: '/portfolio/install-12.webp',   label: 'Privacy film' },
  { src: '/portfolio/panel-1.webp',      label: 'Panels & acrylics' },
  { src: '/portfolio/install-28.webp',   label: 'Panels & acrylics' },
  { src: '/portfolio/install-15.webp',   label: 'Wall graphics' },
  { src: '/portfolio/install-26.webp',   label: 'Storefront signage' },
  { src: '/portfolio/install-37.webp',   label: 'Vehicle wrap' },
  { src: '/portfolio/wall-2.webp',       label: 'Wall graphics' },
  { src: '/portfolio/install-27.webp',   label: 'Wall mural' },
  { src: '/portfolio/install-21.webp',   label: 'Privacy film' },
  { src: '/portfolio/install-02.webp',   label: 'Panels & acrylics' },
  { src: '/portfolio/install-10.webp',   label: 'Storefront signage' },
  { src: '/portfolio/vending-1.webp',    label: 'Vending wrap' },
  { src: '/portfolio/install-05.webp',   label: 'Wall graphics' },
  { src: '/portfolio/install-24.webp',   label: 'Wall mural' },
  { src: '/portfolio/install-40.webp',   label: 'Panels & acrylics' },
  { src: '/portfolio/install-22.webp',   label: 'Privacy film' },
  { src: '/portfolio/install-34.webp',   label: 'Storefront signage' },
  { src: '/portfolio/privacy-2.webp',    label: 'Privacy film' },
  { src: '/portfolio/install-29.webp',   label: 'Wall graphics' },
  { src: '/portfolio/install-03.webp',   label: 'Vending wrap' },
  { src: '/portfolio/install-14.webp',   label: 'Wall graphics' },
  { src: '/portfolio/install-07.webp',   label: 'Storefront signage' },
  { src: '/portfolio/install-25.webp',   label: 'Wall mural' },
  { src: '/portfolio/panel-2.webp',      label: 'Panels & acrylics' },
  { src: '/portfolio/install-18.webp',   label: 'Panels & acrylics' },
  { src: '/portfolio/install-31.webp',   label: 'Privacy film' },
  { src: '/portfolio/install-38.webp',   label: 'Vehicle wrap' },
  { src: '/portfolio/vending-2.webp',    label: 'Vending wrap' },
  { src: '/portfolio/install-16.webp',   label: 'Wall graphics' },
  { src: '/portfolio/install-20.webp',   label: 'Storefront signage' },
  { src: '/portfolio/install-30.webp',   label: 'Panels & acrylics' },
  { src: '/portfolio/install-35.webp',   label: 'Privacy film' },
  { src: '/portfolio/privacy-3.webp',    label: 'Privacy film' },
  { src: '/portfolio/install-33.webp',   label: 'Wall graphics' },
  { src: '/portfolio/install-36.webp',   label: 'Storefront signage' },
  { src: '/portfolio/install-11.webp',   label: 'Storefront signage' }
];

function Showcase() {
  // Render the photo set twice back-to-back so translateX(-50%) loops
  // seamlessly without a visible jump. The aria-hidden duplicate keeps
  // assistive tech from announcing every photo twice.
  return (
    <div className="anim-fadein mt-12 sm:mt-16 mb-10 sm:mb-12 -mx-4 sm:-mx-6 select-none">
      <div className="px-4 sm:px-6 mb-3 sm:mb-4 flex items-center gap-3">
        <span className="h-px w-10" style={{ background: BRAND.boltGrad }} />
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
          Recent work
        </span>
      </div>

      <div className="showcase-mask overflow-hidden">
        <div className="showcase-track flex gap-3 sm:gap-4" style={{ width: 'max-content' }}>
          {SHOWCASE_PHOTOS.map((p, i) => <ShowcaseCard key={`a-${i}`} photo={p} index={i} />)}
          {SHOWCASE_PHOTOS.map((p, i) => <ShowcaseCard key={`b-${i}`} photo={p} index={i} ariaHidden />)}
        </div>
      </div>
    </div>
  );
}

function ShowcaseCard({ photo, index, ariaHidden }) {
  return (
    <div className="showcase-card flex-shrink-0 relative overflow-hidden"
      {...(ariaHidden ? { 'aria-hidden': true } : {})}
      style={{
        width: 'clamp(220px, 28vw, 340px)',
        aspectRatio: '4 / 3',
        background: BRAND.navyDeep,
        border: `1px solid ${BRAND.navyLineStrong}`
      }}>
      <img src={photo.src} alt={ariaHidden ? '' : photo.label}
        loading={index < 3 ? 'eager' : 'lazy'}
        decoding="async"
        className="showcase-img absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover' }} />
      <div className="showcase-label absolute inset-x-0 bottom-0 px-4 py-3 flex items-center gap-2"
        style={{
          background: 'linear-gradient(to top, rgba(8,21,46,0.95), rgba(8,21,46,0.65) 60%, transparent)'
        }}>
        <span className="h-px w-4" style={{ background: BRAND.boltAmber }} />
        <span className="text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textPri }}>
          {photo.label}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//   SHARED — section header (matches the quote tool's style)
// ═══════════════════════════════════════════════════════════════
function SectionHeader({ num, title }) {
  return (
    <div className="anim-slidel flex items-baseline gap-3 sm:gap-4">
      <span style={{
        fontFamily: 'Anton, sans-serif',
        fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
        color: BRAND.boltAmber,
        letterSpacing: '0.02em',
        lineHeight: 1
      }}>
        {num}
      </span>
      <h2 style={{
        fontFamily: 'Anton, sans-serif',
        fontSize: 'clamp(1.75rem, 6vw, 3rem)',
        letterSpacing: '0.02em',
        lineHeight: 1
      }}>
        {title}
      </h2>
    </div>
  );
}
