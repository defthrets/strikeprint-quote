import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Image, Info, Wrench } from 'lucide-react';

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

const NAV_ITEMS = [
  { to: '/',        label: 'Home',        icon: Home,   sub: 'Strike Print homepage' },
  { to: '/gallery', label: 'What We Made', icon: Image, sub: 'Recent installs across Sydney' },
  { to: '/about',   label: 'About',       icon: Info,   sub: 'Our story + videos' },
  { to: '/quote',   label: 'Quote Tool',  icon: Wrench, sub: 'Compose a sign on your photo · ~60s' }
];

export default function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Esc to close + body scroll lock
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
        aria-label="Open menu"
        className="md:hidden flex items-center justify-center w-10 h-10 cursor-pointer"
        style={{
          color: BRAND.textPri,
          border: `1px solid ${BRAND.navyLineStrong}`,
          background: 'rgba(8,21,46,0.6)'
        }}>
        <Menu className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Portal so the panel escapes the header's backdrop-filter
          (which would otherwise act as a containing block for fixed). */}
      {open && ReactDOM.createPortal(
        <div onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] anim-fadein overflow-y-auto flex items-start justify-center p-4 sm:p-6"
          style={{
            background: 'rgba(8, 21, 46, 0.92)',
            backdropFilter: 'blur(8px)',
            color: BRAND.textPri,
            fontFamily: "'Outfit', sans-serif"
          }}>
          <div onClick={(e) => e.stopPropagation()}
            className="anim-scalein relative w-full max-w-md mt-12 my-auto"
            style={{
              background: 'rgba(15, 32, 70, 0.95)',
              border: `1px solid ${BRAND.boltAmber}40`,
              borderTop: `3px solid ${BRAND.boltAmber}`,
              backdropFilter: 'blur(12px)'
            }}>
            <button onClick={() => setOpen(false)} title="Close (Esc)" aria-label="Close menu"
              className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 transition-colors hover:bg-white/5"
              style={{ color: BRAND.textMuted, border: `1px solid ${BRAND.navyLineStrong}` }}>
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-10" style={{ background: BRAND.boltGrad }} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  Menu
                </span>
              </div>

              <div className="space-y-2">
                {NAV_ITEMS.map(item => {
                  const isCurrent = location.pathname === item.to;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      style={{
                        background: isCurrent ? `${BRAND.boltAmber}15` : 'rgba(8, 21, 46, 0.55)',
                        border: `1px solid ${isCurrent ? BRAND.boltAmber : BRAND.navyLine}`,
                        borderLeft: `3px solid ${BRAND.boltAmber}`,
                        color: BRAND.textPri,
                        textDecoration: 'none'
                      }}>
                      <div className="flex items-center justify-center w-10 h-10 flex-shrink-0"
                        style={{ background: BRAND.navyDeep, border: `1px solid ${BRAND.boltAmber}40`, color: BRAND.boltAmber }}>
                        <item.icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{
                          fontFamily: 'Bebas Neue, sans-serif',
                          fontSize: '1.2rem',
                          letterSpacing: '0.03em',
                          lineHeight: 1.1,
                          color: BRAND.textPri
                        }}>
                          {item.label}
                        </div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: BRAND.textMuted }}>
                          {item.sub}
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold flex-shrink-0"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                          Here
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
