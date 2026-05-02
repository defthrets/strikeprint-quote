import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Phone, Mail, Wrench, X, ChevronRight } from 'lucide-react';

// Local copy of the few brand tokens this component needs. Kept inline so
// dropping <GetQuoteButton /> into Home / Gallery / About doesn't require
// passing a brand prop at every callsite.
const BRAND = {
  navy:           '#012659',
  navyDeep:       '#08152e',
  navyLine:       'rgba(255, 255, 255, 0.08)',
  navyLineStrong: 'rgba(255, 255, 255, 0.15)',
  boltAmber:      '#f59a10',
  textPri:        '#f8fafc',
  textMuted:      '#cbd5e1',
  textDim:        '#94a3b8',
  boltGrad:       'linear-gradient(135deg, #f59a10, #f0601f, #fad905)'
};

const PHONE_TEL = '0422626286';
const PHONE_DISPLAY = '0422 626 286';
const EMAIL = 'info@strikeprint.com.au';

export default function GetQuoteButton({ className = '' }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.18em] font-bold cursor-pointer ${className}`}
        style={{
          background: BRAND.boltGrad,
          color: BRAND.navy,
          fontFamily: 'Anton, sans-serif',
          letterSpacing: '0.1em',
          border: 'none'
        }}>
        <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
        Get a Quote
      </button>

      {open && (
        <div onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 anim-fadein flex items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(8, 21, 46, 0.92)', backdropFilter: 'blur(8px)' }}>
          <div onClick={(e) => e.stopPropagation()}
            className="anim-scalein relative w-full max-w-md"
            style={{
              background: 'rgba(15, 32, 70, 0.92)',
              border: `1px solid ${BRAND.boltAmber}40`,
              borderTop: `3px solid ${BRAND.boltAmber}`,
              backdropFilter: 'blur(12px)'
            }}>
            <button onClick={() => setOpen(false)} title="Close (Esc)"
              className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 transition-colors hover:bg-white/5"
              style={{ color: BRAND.textMuted, border: `1px solid ${BRAND.navyLineStrong}` }}>
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>

            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="h-px w-10" style={{ background: BRAND.boltGrad }} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  Get in touch
                </span>
              </div>
              <h2 className="mb-1" style={{
                fontFamily: 'Anton, sans-serif',
                letterSpacing: '0.02em',
                fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                lineHeight: 1.05
              }}>
                How would you like to start?
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: BRAND.textMuted }}>
                Pick whatever's easiest — we'll come back to you fast.
              </p>

              <div className="space-y-3">
                <Option href={`tel:${PHONE_TEL}`} icon={Phone} label="Call us"
                  sub={PHONE_DISPLAY} />
                <Option href={`mailto:${EMAIL}`} icon={Mail} label="Email us"
                  sub={EMAIL} />
                <Option to="/quote" onClickClose={() => setOpen(false)} icon={Wrench}
                  label="Instant quote tool" sub="Compose your sign on a real photo · ~60s" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Option({ href, to, onClickClose, icon: Icon, label, sub }) {
  const inner = (
    <>
      <div className="flex items-center justify-center w-11 h-11 flex-shrink-0"
        style={{ background: BRAND.navyDeep, border: `1px solid ${BRAND.boltAmber}40`, color: BRAND.boltAmber }}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '1.25rem',
          letterSpacing: '0.03em',
          lineHeight: 1.1,
          color: BRAND.textPri
        }}>
          {label}
        </div>
        <div className="text-xs mt-0.5 truncate" style={{ color: BRAND.textMuted }}>
          {sub}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.textDim }} />
    </>
  );

  const cls = "lift flex items-center gap-3 p-3 cursor-pointer w-full";
  const style = {
    background: 'rgba(8, 21, 46, 0.55)',
    border: `1px solid ${BRAND.navyLine}`,
    borderLeft: `3px solid ${BRAND.boltAmber}`,
    color: BRAND.textPri,
    textDecoration: 'none'
  };

  if (to) {
    return <Link to={to} className={cls} style={style} onClick={onClickClose}>{inner}</Link>;
  }
  return <a href={href} className={cls} style={style}>{inner}</a>;
}
