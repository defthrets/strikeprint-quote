import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, LogOut, AlertTriangle, Loader2, ArrowLeft, Image as ImageIcon, Type, Palette, Settings } from 'lucide-react';
import { LOGO_URL } from './logo.js';

const BRAND = {
  navy:           '#012659',
  navyDeep:       '#08152e',
  navyRaise:      'rgba(15, 32, 70, 0.7)',
  navyLine:       'rgba(255, 255, 255, 0.08)',
  navyLineStrong: 'rgba(255, 255, 255, 0.15)',
  boltAmber:      '#f59a10',
  textPri:        '#f8fafc',
  textMuted:      '#cbd5e1',
  textDim:        '#94a3b8',
  textFaint:      '#64748b',
  boltGrad:       'linear-gradient(135deg, #f59a10, #f0601f, #fad905)'
};

// Auth state machine: 'checking' (initial) → 'authed' or 'login'.
// 'login' shows the password form. 'authed' shows the dashboard.
export default function Admin() {
  const [authState, setAuthState] = useState('checking');

  // Probe /api/admin/me on mount to see if the cookie is already valid.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/me', { credentials: 'same-origin' })
      .then(r => r.ok ? 'authed' : 'login')
      .catch(() => 'login')
      .then(state => { if (!cancelled) setAuthState(state); });
    return () => { cancelled = true; };
  }, []);

  // Load fonts + animation styles
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  const onLoginSuccess = () => setAuthState('authed');
  const onLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
    setAuthState('login');
  };

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      minHeight: '100vh',
      color: BRAND.textPri,
      background: `radial-gradient(ellipse at top left, rgba(245,154,16,0.06), transparent 60%),
                   linear-gradient(180deg, ${BRAND.navyDeep} 0%, ${BRAND.navy} 100%)`
    }}>
      {/* Compact header */}
      <header style={{ background: 'rgba(8, 21, 46, 0.78)', borderBottom: `1px solid ${BRAND.navyLine}` }}
        className="sticky top-0 z-40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Strike Print" className="h-12 sm:h-14 w-auto" />
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase tracking-[0.25em]"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
                Strike Print Admin
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: '18px', letterSpacing: '0.04em', lineHeight: 1 }}>
                Content Editor
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.18em] hover:text-amber-400 transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textMuted }}>
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              Back to site
            </Link>
            {authState === 'authed' && (
              <button onClick={onLogout}
                className="inline-flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.18em] cursor-pointer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'rgba(8,21,46,0.6)',
                  border: `1px solid ${BRAND.navyLineStrong}`,
                  color: BRAND.textPri
                }}>
                <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {authState === 'checking' && <CheckingState />}
        {authState === 'login' && <LoginForm onSuccess={onLoginSuccess} />}
        {authState === 'authed' && <Dashboard />}
      </main>
    </div>
  );
}

function CheckingState() {
  return (
    <div className="flex items-center justify-center py-24" style={{ color: BRAND.textDim }}>
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="ml-3 text-sm uppercase tracking-[0.25em]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Checking session…
      </span>
    </div>
  );
}

function LoginForm({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (r.status === 204) {
        setPassword('');
        onSuccess();
        return;
      }
      const body = await r.json().catch(() => ({}));
      setError(body.error || `HTTP ${r.status}`);
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-4"
          style={{
            background: BRAND.navyDeep,
            border: `1px solid ${BRAND.boltAmber}40`,
            color: BRAND.boltAmber
          }}>
          <Lock className="w-5 h-5" strokeWidth={2} />
        </div>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', letterSpacing: '0.02em', lineHeight: 1 }}>
          Admin sign in
        </h1>
        <p className="mt-2 text-sm" style={{ color: BRAND.textMuted }}>
          Single-admin access. Enter the workshop password.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 p-5 sm:p-6"
        style={{
          background: BRAND.navyRaise,
          border: `1px solid ${BRAND.navyLineStrong}`,
          borderTop: `2px solid ${BRAND.boltAmber}`,
          backdropFilter: 'blur(8px)'
        }}>
        <div>
          <label className="text-[10px] uppercase tracking-[0.22em] block mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            Password
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            disabled={busy} autoFocus
            className="w-full px-4 py-3 outline-none text-sm"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: 'rgba(8,21,46,0.6)',
              border: `1px solid ${BRAND.navyLineStrong}`,
              color: BRAND.textPri
            }} />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 text-sm"
            style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={busy || !password}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: BRAND.boltGrad,
            color: BRAND.navy,
            fontFamily: 'Anton, sans-serif',
            letterSpacing: '0.1em',
            border: 'none'
          }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" strokeWidth={2.5} />}
          <span className="text-base">Sign in</span>
        </button>
      </form>

      <p className="mt-6 text-center text-[10px] uppercase tracking-[0.25em]"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
        Lost the password? See README → admin
      </p>
    </div>
  );
}

// Phase 1 dashboard is just the shell — tabs are stubs that come online in
// later phases. Each tab will mount its own component (PhotosTab, ContentTab,
// etc.) once the backing API and DB are wired up.
function Dashboard() {
  const tabs = [
    { id: 'photos',   label: 'Photos',          icon: ImageIcon, status: 'Phase 2' },
    { id: 'content',  label: 'Content',         icon: Type,      status: 'Phase 3' },
    { id: 'theme',    label: 'Colours & fonts', icon: Palette,   status: 'Phase 4' },
    { id: 'settings', label: 'Settings',        icon: Settings,  status: 'Phase 4' }
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="h-px w-10" style={{ background: BRAND.boltGrad }} />
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
          Welcome back · Mick
        </span>
      </div>

      <h1 className="mb-2" style={{
        fontFamily: 'Anton, sans-serif',
        fontSize: 'clamp(2rem, 6vw, 3rem)',
        letterSpacing: '0.02em',
        lineHeight: 1.05
      }}>
        Content editor
      </h1>
      <p className="text-sm sm:text-base mb-8" style={{ color: BRAND.textMuted }}>
        Edit the website without touching code. Phase 1 is live (auth working) —
        the actual editing tabs come online over the next few deploys.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {tabs.map(t => (
          <div key={t.id}
            className="p-5 sm:p-6 relative"
            style={{
              background: BRAND.navyRaise,
              border: `1px solid ${BRAND.navyLine}`,
              borderLeft: `3px solid ${BRAND.boltAmber}`,
              opacity: 0.6
            }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10"
                  style={{ background: BRAND.navyDeep, border: `1px solid ${BRAND.boltAmber}40`, color: BRAND.boltAmber }}>
                  <t.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.4rem',
                  letterSpacing: '0.03em',
                  color: BRAND.textPri
                }}>
                  {t.label}
                </div>
              </div>
              <span className="px-2 py-1 text-[9px] uppercase tracking-[0.22em] font-bold"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'rgba(8,21,46,0.6)',
                  border: `1px solid ${BRAND.navyLineStrong}`,
                  color: BRAND.textDim
                }}>
                {t.status}
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
              {t.id === 'photos'   && 'Upload, label and reorder gallery photos. Photos sync immediately to the public site.'}
              {t.id === 'content'  && 'Edit hero copy, services, contact info and about page text. Form-based editing.'}
              {t.id === 'theme'    && 'Pick brand colours and fonts. Live preview shows changes before publishing.'}
              {t.id === 'settings' && 'Change password, sign out, export or restore content backups.'}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 p-5 sm:p-6"
        style={{
          background: 'rgba(245,154,16,0.05)',
          border: `1px dashed ${BRAND.boltAmber}40`
        }}>
        <div className="text-[10px] uppercase tracking-[0.22em] mb-2"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
          Phase 1 status
        </div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', letterSpacing: '0.03em' }}>
          Authentication live
        </div>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
          You can sign in and out. The four editor tabs above will fill in over
          the next deploys — Photos first (Phase 2), then Content, then Colours.
        </p>
      </div>
    </div>
  );
}
