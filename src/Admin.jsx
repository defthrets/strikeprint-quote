import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { upload } from '@vercel/blob/client';
import { Lock, LogOut, AlertTriangle, Loader2, ArrowLeft, Image as ImageIcon, Type, Palette, Settings, Upload, Trash2, Plus, Check, Star, Eye, EyeOff } from 'lucide-react';
import { LOGO_URL } from './logo.js';
import { SERVICE_CATEGORIES, DISPLAY_FONT_OPTIONS, BODY_FONT_OPTIONS } from './services-meta.js';

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
  // Username of the signed-in admin (mick / kelvin / paul / andrew).
  // Populated from /api/admin/me on session probe and from /api/admin/login
  // on successful sign-in. Drives the welcome message + audit display.
  const [user, setUser] = useState(null);

  // Probe /api/admin/me on mount to see if the cookie is already valid.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/me', { credentials: 'same-origin' })
      .then(async r => {
        if (!r.ok) return { state: 'login', user: null };
        const body = await r.json().catch(() => ({}));
        return { state: 'authed', user: body.username || null };
      })
      .catch(() => ({ state: 'login', user: null }))
      .then(({ state, user }) => {
        if (cancelled) return;
        setAuthState(state);
        setUser(user);
      });
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

  const onLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser || null);
    setAuthState('authed');
  };
  const onLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
    setUser(null);
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
            {authState === 'authed' && user && (
              <span className="hidden md:inline-flex items-center px-3 py-2 text-[11px] uppercase tracking-[0.18em]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: BRAND.boltAmber
                }}>
                Signed in · {capitalise(user)}
              </span>
            )}
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
        {authState === 'authed' && <Dashboard user={user} />}
      </main>
    </div>
  );
}

// Title-case a username for display: 'mick' → 'Mick'.
function capitalise(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  // Free-text username input — no dropdown, no localStorage pre-fill.
  // Admins type their name fresh each time. Server normaliseUsername
  // does .trim().toLowerCase() so "Mick" / "MICK" / " mick " all
  // resolve to "mick" — case + whitespace insensitive on the wire.
  // The browser's saved-password manager can still autofill via the
  // autoComplete="username" hint below.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      });
      if (r.ok) {
        const body = await r.json().catch(() => ({}));
        const verifiedUser = body.username || cleanUsername;
        setPassword('');
        onSuccess(verifiedUser);
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
          Type your name and workshop password.
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
          <label htmlFor="admin-username"
            className="text-[10px] uppercase tracking-[0.22em] block mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            Username
          </label>
          {/* Free-text input — no dropdown, no pre-fill. autoComplete +
              name="username" hint lets the browser's password manager
              autofill if the admin's saved this site. spellCheck off so
              "Mick" doesn't get red-underlined as a typo. The server
              lowercases on receive, so any caps work. */}
          <input id="admin-username" type="text" value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={busy} autoFocus
            autoComplete="username"
            name="username"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="e.g. mick"
            className="w-full px-4 py-3 outline-none text-sm"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: 'rgba(8,21,46,0.6)',
              border: `1px solid ${BRAND.navyLineStrong}`,
              color: BRAND.textPri
            }} />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.22em] block mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            Password
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            disabled={busy}
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

        <button type="submit" disabled={busy || !password || !username.trim()}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: BRAND.boltGrad,
            color: BRAND.navy,
            fontFamily: 'Anton, sans-serif',
            letterSpacing: '0.1em',
            border: 'none'
          }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" strokeWidth={2.5} />}
          <span className="text-base">
            {username.trim()
              ? `Sign in as ${capitalise(username.trim().toLowerCase())}`
              : 'Sign in'}
          </span>
        </button>
      </form>

      <p className="mt-6 text-center text-[10px] uppercase tracking-[0.25em]"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
        Lost the password? See README → admin
      </p>
    </div>
  );
}

const TABS = [
  { id: 'photos',   label: 'Photos',          icon: ImageIcon, ready: true, status: 'Live' },
  { id: 'content',  label: 'Content',         icon: Type,      ready: true, status: 'Live' },
  { id: 'theme',    label: 'Colours & fonts', icon: Palette,   ready: true, status: 'Live' },
  { id: 'settings', label: 'Settings',        icon: Settings,  ready: true, status: 'Live' }
];

function Dashboard({ user }) {
  const [tab, setTab] = useState('photos');
  const active = TABS.find(t => t.id === tab) || TABS[0];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="h-px w-10" style={{ background: BRAND.boltGrad }} />
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
          Welcome back · {user ? capitalise(user) : 'Admin'}
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
      <p className="text-sm sm:text-base mb-6" style={{ color: BRAND.textMuted }}>
        Edit the website without touching code. Every save is live within
        about 10 seconds — no rebuild, no git push needed.
      </p>

      {/* How publishing works — surfaces the "your edits are live" guarantee
          so admin doesn't go looking for a deploy / publish button. The
          live site reads from the same database (gallery.json in Vercel
          Blob) the admin writes to; the only delay is a 10s CDN cache. */}
      <div className="p-4 mb-8 flex items-start gap-3 flex-wrap"
        style={{
          background: 'rgba(8,21,46,0.55)',
          border: `1px solid ${BRAND.navyLineStrong}`,
          borderLeft: `3px solid ${BRAND.boltAmber}`
        }}>
        <div className="flex-1 min-w-[260px]">
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold mb-1.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            How publishing works
          </div>
          <p className="text-sm leading-relaxed" style={{ color: BRAND.textMuted }}>
            Edits save instantly to the same database the public site reads
            from. Changes show up at <code style={{ color: BRAND.textPri }}>strikeprint.com.au</code>{' '}
            within about 10 seconds — refresh the page (or wait a few seconds)
            to see them. There&apos;s no separate "publish" or "deploy" step.
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 cursor-pointer"
          style={{
            background: BRAND.boltGrad,
            color: BRAND.navy,
            fontFamily: 'Anton, sans-serif',
            letterSpacing: '0.08em',
            border: 'none',
            textDecoration: 'none'
          }}>
          <span className="text-sm">View live site →</span>
        </a>
      </div>

      {/* Recent activity — who edited what, most recent first. Reads
          from /api/admin/content's audit log. Collapsed by default. */}
      <AuditPanel />

      {/* Tab nav */}
      <div className="flex flex-wrap gap-2 mb-8" style={{ borderBottom: `1px solid ${BRAND.navyLine}` }}>
        {TABS.map(t => {
          const isActive = t.id === tab;
          return (
            <button key={t.id} onClick={() => t.ready && setTab(t.id)}
              disabled={!t.ready}
              className="inline-flex items-center gap-2 px-4 py-3 text-[11px] uppercase tracking-[0.2em] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: isActive ? `${BRAND.boltAmber}15` : 'transparent',
                color: isActive ? BRAND.boltAmber : BRAND.textMuted,
                borderBottom: isActive ? `2px solid ${BRAND.boltAmber}` : '2px solid transparent',
                border: 'none',
                cursor: t.ready ? 'pointer' : 'not-allowed',
                marginBottom: '-1px'
              }}>
              <t.icon className="w-3.5 h-3.5" strokeWidth={2} />
              {t.label}
              {!t.ready && (
                <span className="px-1.5 py-0.5 text-[9px]"
                  style={{ background: 'rgba(8,21,46,0.6)', color: BRAND.textDim, border: `1px solid ${BRAND.navyLine}` }}>
                  {t.status}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {active.id === 'photos'   && <PhotosTab />}
      {active.id === 'content'  && <ContentTab />}
      {active.id === 'theme'    && <ThemeTab />}
      {active.id === 'settings' && <SettingsTab />}
      {!active.ready && <PlaceholderTab tab={active} />}
    </div>
  );
}

function PlaceholderTab({ tab }) {
  return (
    <div className="p-8 text-center"
      style={{
        background: 'rgba(245,154,16,0.05)',
        border: `1px dashed ${BRAND.boltAmber}40`
      }}>
      <tab.icon className="w-12 h-12 mx-auto mb-3" style={{ color: BRAND.boltAmber }} strokeWidth={1.5} />
      <div className="mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', letterSpacing: '0.03em' }}>
        {tab.label} editor — {tab.status}
      </div>
      <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: BRAND.textMuted }}>
        Coming online in the next deploy. Photos tab is live now if you'd like
        to test the editor end-to-end.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Recent activity — collapsible panel showing the last few audit
// entries (who did what + when). Source: /api/admin/content GET,
// which reads gallery.audit (server caps it to 200 recent entries).
//
// Collapsed by default so the dashboard isn't cluttered; admin can
// expand to scan the last edits at a glance.

const ACTION_LABELS = {
  'photo.add':            'added',
  'photo.delete':         'deleted',
  'photo.relabel':        'renamed',
  'photo.recategorise':   'moved group',
  'photo.setCover':       'set as cover',
  'photo.unsetCover':     'unset cover',
  'photo.update':         'updated',
  'photo.reorder':        'reordered photos',
  'content.services':     'edited service group',
  'content.hero':         'edited hero',
  'content.about':        'edited about',
  'content.services_intro': 'edited services intro',
  'content.contact_intro':  'edited contact intro',
  'content.contact':      'edited contact info',
  'content.materials':    'edited materials',
  'content.materials_rows': 'edited materials list',
  'content.pillars':      'edited pillars',
  'content.reviews':      'edited reviews CTA',
  'content.big_cta':      'edited big CTA',
  'content.footer':       'edited footer'
};

function describeAction(action) {
  return ACTION_LABELS[action] || action.replace(/^[^.]+\./, '');
}

function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!then) return '';
  const diff = Date.now() - then;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function AuditPanel() {
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/content', { credentials: 'same-origin', cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data) return;
        setAudit(Array.isArray(data.audit) ? data.audit : []);
      })
      .catch(() => { /* silently ignore — panel just stays empty */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Hide the panel entirely when there's no data — first deploy will
  // have an empty audit log and we don't want to show a blank section.
  if (!loading && audit.length === 0) return null;

  const preview = audit.slice(0, 3);
  const visible = open ? audit : preview;

  return (
    <div className="mb-8"
      style={{
        background: 'rgba(8,21,46,0.55)',
        border: `1px solid ${BRAND.navyLineStrong}`,
        borderLeft: `3px solid ${BRAND.boltAmber}`
      }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 cursor-pointer text-left"
        style={{ background: 'transparent', border: 'none', color: BRAND.textPri }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold flex-shrink-0"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            Recent activity
          </span>
          {!open && preview[0] && (
            <span className="text-xs truncate" style={{ color: BRAND.textMuted }}>
              {capitalise(preview[0].user)} {describeAction(preview[0].action)}
              {preview[0].target ? ` — ${preview[0].target}` : ''}
              <span style={{ color: BRAND.textFaint, marginLeft: 6 }}>· {relativeTime(preview[0].at)}</span>
            </span>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-[0.22em]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
          {open ? 'Hide' : `Show ${audit.length}`}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3" style={{ borderTop: `1px solid ${BRAND.navyLine}` }}>
          {loading ? (
            <div className="py-4 text-center text-xs" style={{ color: BRAND.textDim }}>Loading…</div>
          ) : (
            <ul className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {visible.map((entry, i) => (
                <li key={`${entry.rev}-${i}`}
                  className="flex items-start gap-3 py-2"
                  style={{ borderBottom: i < visible.length - 1 ? `1px solid ${BRAND.navyLine}` : 'none' }}>
                  <span className="flex-shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] font-bold"
                    style={{
                      background: `${BRAND.boltAmber}20`,
                      color: BRAND.boltAmber,
                      border: `1px solid ${BRAND.boltAmber}40`,
                      minWidth: 60,
                      textAlign: 'center'
                    }}>
                    {capitalise(entry.user)}
                  </span>
                  <span className="flex-1 min-w-0" style={{ color: BRAND.textPri }}>
                    {describeAction(entry.action)}
                    {entry.target && (
                      <span style={{ color: BRAND.textMuted }}> — {entry.target}</span>
                    )}
                  </span>
                  <span className="flex-shrink-0 text-[10px]" style={{ color: BRAND.textFaint }}>
                    {relativeTime(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Caption text shown over the photo in the lightbox. Suggested via a
// <datalist> on the upload form and the per-photo edit field — admin can
// pick from these or type anything new. The service-category dropdown is
// separate (see SERVICE_CATEGORIES from services-meta.js).
const SEED_LABEL_SUGGESTIONS = [
  'Storefront signage', 'Wall graphics', 'Wall mural', 'Privacy film',
  'Vending wrap', 'Vehicle wrap', 'Lightbox', 'Panels & acrylics',
  'Bar graphics', 'Banners', 'Tradie signage', 'Hanging fabric banners',
  'Window vinyl graphics', 'Custom vinyl', 'Custom privacy frosting',
  'Inhouse production', 'Panels & promotional', 'Illuminated bar graphics',
  'Illuminated storefront'
];

// Lookup: category slug → display info (used in dropdowns, group headings).
// Plus a sentinel for "uncategorised" so photos that aren't in any service
// group still appear in the admin UI.
const CATEGORY_OPTIONS = [
  { slug: '__uncat__', num: '—',  title: 'Uncategorised',          body: 'Not shown on any service tile' },
  ...SERVICE_CATEGORIES.map(c => ({ slug: c.slug, num: c.num, title: c.title, body: c.body }))
];
function categoryLabel(slug) {
  const c = CATEGORY_OPTIONS.find(o => o.slug === (slug || '__uncat__'));
  return c ? `${c.num} · ${c.title}` : 'Unknown';
}

function PhotosTab() {
  const [photos, setPhotos] = useState([]);
  // Per-service title/body — admin overrides merged with defaults.
  // Shape: [{ slug, num, title, body, defaults: {title, body} }]
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [defaultCategory, setDefaultCategory] = useState(SERVICE_CATEGORIES[0].slug);
  const [defaultLabel, setDefaultLabel] = useState('Storefront signage');
  const fileInputRef = useRef(null);

  // Free-text label suggestions: existing labels in use + a small seed list,
  // de-duplicated. Used for the per-photo caption text (separate from the
  // service category — the label is the lightbox caption).
  const labelSuggestions = useMemo(() => {
    const live = photos.map(p => p.label).filter(Boolean);
    return Array.from(new Set([...SEED_LABEL_SUGGESTIONS, ...live])).sort();
  }, [photos]);

  // Live category options for the per-photo dropdowns + the upload bar.
  // Pulls titles from the merged services state so admin-renamed groups
  // (e.g. "Vehicle Wraps & Decals" → "Vending") show the new name on
  // every dropdown immediately. Falls back to the static defaults
  // before /api/admin/content has resolved.
  const liveCategoryOptions = useMemo(() => {
    const uncat = { slug: '__uncat__', num: '—', title: 'Uncategorised' };
    if (!services || services.length === 0) return CATEGORY_OPTIONS;
    return [uncat, ...services.map(s => ({ slug: s.slug, num: s.num, title: s.title }))];
  }, [services]);

  // Group photos by their service category for the rendered UI. Each group
  // is one collapsible section showing how that service tile will look.
  const grouped = useMemo(() => {
    const buckets = new Map();
    CATEGORY_OPTIONS.forEach(c => buckets.set(c.slug, []));
    photos.forEach(p => {
      const key = p.category || '__uncat__';
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(p);
    });
    // Within each bucket, sort by order
    buckets.forEach(arr => arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    return buckets;
  }, [photos]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      // cache: 'no-store' on every admin fetch — defeats browser cache
      // so a PATCH-then-GET sequence after a save can't serve a stale
      // GET response (which would make the save look like it didn't take).
      const [photosRes, contentRes] = await Promise.all([
        fetch('/api/admin/photos',  { credentials: 'same-origin', cache: 'no-store' }),
        fetch('/api/admin/content', { credentials: 'same-origin', cache: 'no-store' })
      ]);
      if (!photosRes.ok)  throw new Error(`Photos load failed (${photosRes.status})`);
      if (!contentRes.ok) throw new Error(`Content load failed (${contentRes.status})`);
      const photosData  = await photosRes.json();
      const contentData = await contentRes.json();
      const sorted = [...(photosData.photos || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setPhotos(sorted);
      setServices(contentData?.merged?.services || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // Helper for the saveService merge below — produces the same
  // {slug, num, title, body, defaults} shape that /api/admin/content
  // GET returns, falling back to the static SERVICE_CATEGORIES defaults
  // when there's no override yet.
  const toFallbackMerged = (cat) => ({
    slug: cat.slug,
    num: cat.num,
    title: cat.title,
    body: cat.body,
    defaults: { title: cat.title, body: cat.body }
  });

  // Save service title/body overrides. Empty string = reset to default.
  // Returns { ok, error? } so caller can surface failure inline.
  //
  // After PATCH success, derives the new merged services view from the
  // freshly-written gallery in the PATCH response — no second GET round
  // trip. Avoids two failure modes I hit earlier:
  //   1) browser caching the GET response so the second fetch returns
  //      stale data and the UI looks like it didn't save
  //   2) the second fetch failing for some other reason (network blip,
  //      auth tick) leaving us in "save succeeded but refresh failed"
  //      where the user sees an error despite their data being saved.
  const saveService = async (slug, fields) => {
    setError(null);
    try {
      const r = await fetch('/api/admin/content', {
        method: 'PATCH',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'services', updates: { [slug]: fields } })
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${r.status})`);
      }
      // The PATCH response is the freshly-written gallery payload. We
      // already have all the per-slug overrides we need — recompute the
      // merged services view client-side instead of going back to the
      // server. Mirrors the merge logic in api/admin/content.js GET.
      const data = await r.json();
      const galleryServices = data?.services || {};
      setServices((prev) => (prev || SERVICE_CATEGORIES.map(toFallbackMerged))
        .map(s => {
          const o = galleryServices[s.slug] || {};
          const def = s.defaults || { title: s.title, body: s.body };
          return {
            slug: s.slug,
            num:  s.num,
            title: o.title || def.title,
            body:  o.body  || def.body,
            defaults: def
          };
        }));
      return { ok: true };
    } catch (err) {
      setError(err.message);
      return { ok: false, error: err.message };
    }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload',
        clientPayload: JSON.stringify({ originalName: file.name }),
        onUploadProgress: (p) => setUploadProgress(Math.round(p.percentage || 0))
      });
      // Register in gallery.json with the chosen service category and label
      const r = await fetch('/api/admin/photos', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: blob.url,
          label: defaultLabel,
          category: defaultCategory === '__uncat__' ? null : defaultCategory
        })
      });
      if (!r.ok) throw new Error('Upload registered but metadata save failed');
      await refresh();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Patch queue — every photo PATCH chains onto this so requests run
  // strictly sequentially. Without serialization, two fast edits in a
  // row both read gallery.json at the same time, modify their target,
  // and the slower write clobbers the faster one's changes (last-
  // write-wins because Vercel Blob has no field-level updates). This
  // manifested as: move photo A → vehicle, quickly move photo B →
  // banners, then A snaps back to its old group when B's response
  // lands. Queue keeps the UI snappy (optimistic state still applies
  // immediately) while the real writes go through one at a time.
  const patchQueueRef = useRef(Promise.resolve());

  // Generic patch — sends whichever subset of { label, category, featured }
  // the caller provides. Server validates + atomically clears featured on
  // siblings when a new cover is set. Returns { ok, error } so PhotoRow
  // can show per-row feedback (the page-level error banner is fine for
  // upload failures, but per-row mutations should surface inline).
  const patchPhoto = (id, patch) => {
    const run = async () => {
      setError(null);
      try {
        const r = await fetch('/api/admin/photos', {
          method: 'PATCH',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...patch })
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `Update failed (${r.status})`);
        }
        const data = await r.json();
        setPhotos([...(data.photos || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        return { ok: true };
      } catch (err) {
        // Fall through to the page-level banner too in case the row UI is
        // off-screen, but the row's own error display is the primary signal.
        setError(err.message);
        return { ok: false, error: err.message };
      }
    };
    // Chain this run onto the queue; each call gets its own resolved
    // result, but they execute one after another. .catch on the queue
    // tail swallows errors so a failed patch doesn't break the chain
    // for subsequent ones.
    const result = patchQueueRef.current.then(run, run);
    patchQueueRef.current = result.catch(() => {});
    return result;
  };

  const removePhoto = async (id) => {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    setError(null);
    try {
      const r = await fetch('/api/admin/photos', {
        method: 'DELETE',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!r.ok) throw new Error('Delete failed');
      const data = await r.json();
      setPhotos([...(data.photos || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* Upload bar */}
      <div className="p-4 sm:p-5 mb-6 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end"
        style={{
          background: BRAND.navyRaise,
          border: `1px solid ${BRAND.navyLineStrong}`,
          borderTop: `2px solid ${BRAND.boltAmber}`
        }}>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] mb-1"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            Service group
          </div>
          <select value={defaultCategory} onChange={e => setDefaultCategory(e.target.value)}
            disabled={uploading}
            className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: 'rgba(8,21,46,0.6)',
              border: `1px solid ${BRAND.navyLineStrong}`,
              color: BRAND.textPri
            }}>
            {liveCategoryOptions.map(c => (
              <option key={c.slug} value={c.slug}>{c.num} · {c.title}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] mb-1"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            Caption (lightbox)
          </div>
          <input list="label-suggestions" value={defaultLabel}
            onChange={e => setDefaultLabel(e.target.value)}
            disabled={uploading}
            placeholder="e.g. Storefront signage"
            className="w-full px-3 py-2 text-sm outline-none"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: 'rgba(8,21,46,0.6)',
              border: `1px solid ${BRAND.navyLineStrong}`,
              color: BRAND.textPri
            }} />
          <datalist id="label-suggestions">
            {labelSuggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={onUpload}
          disabled={uploading} className="hidden" />

        <button onClick={() => fileInputRef.current?.click()} disabled={uploading || !defaultLabel.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-fit"
          style={{
            background: BRAND.boltGrad,
            color: BRAND.navy,
            fontFamily: 'Anton, sans-serif',
            letterSpacing: '0.1em',
            border: 'none'
          }}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" strokeWidth={2.5} />}
          <span className="text-base">{uploading ? `Uploading ${uploadProgress}%` : 'Upload photo'}</span>
        </button>
      </div>

      {/* Errors */}
      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 text-sm"
          style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading / empty */}
      {loading ? (
        <div className="flex items-center justify-center py-16" style={{ color: BRAND.textDim }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="ml-3 text-xs uppercase tracking-[0.25em]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Loading photos…
          </span>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16" style={{ color: BRAND.textMuted }}>
          <ImageIcon className="w-12 h-12 mx-auto mb-3" style={{ color: BRAND.boltAmber, opacity: 0.5 }} strokeWidth={1.5} />
          <p className="text-sm">No photos yet — hit "Upload photo" above to add the first one.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* One section per service category. Empty buckets render the
              header so admin can see where photos are missing — there's a
              "no photos yet" notice instead of the grid. */}
          {CATEGORY_OPTIONS.map(cat => {
            const bucket = grouped.get(cat.slug) || [];
            const isUncat = cat.slug === '__uncat__';
            // Hide the uncategorised bucket when it's empty — only show
            // it when there's actually something needing attention.
            if (isUncat && bucket.length === 0) return null;
            const featured = bucket.find(p => p.featured);
            // Live-merged title/body for this group (admin override or default)
            const merged = (services || []).find(s => s.slug === cat.slug);
            return (
              <section key={cat.slug}>
                {isUncat ? (
                  <header className="flex items-baseline gap-3 mb-3 pb-2"
                    style={{ borderBottom: `1px solid ${BRAND.navyLine}` }}>
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: BRAND.boltAmber, minWidth: 32
                      }}>
                      {cat.num}
                    </span>
                    <h3 className="text-base sm:text-lg" style={{
                      fontFamily: 'Anton, sans-serif', letterSpacing: '0.02em', color: BRAND.textPri
                    }}>
                      {cat.title}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.22em] ml-auto"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
                      {bucket.length} {bucket.length === 1 ? 'photo' : 'photos'}
                    </span>
                  </header>
                ) : (
                  <ServiceGroupHeader cat={cat} merged={merged}
                    photoCount={bucket.length} hasCover={!!featured}
                    onSave={(fields) => saveService(cat.slug, fields)} />
                )}

                {bucket.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs"
                    style={{
                      color: BRAND.textFaint,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.18em',
                      border: `1px dashed ${BRAND.navyLine}`,
                      textTransform: 'uppercase'
                    }}>
                    No photos yet — homepage uses fallback images for this group
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bucket.map(p => (
                      <PhotoRow key={p.id} photo={p}
                        labelSuggestions={labelSuggestions}
                        categoryOptions={liveCategoryOptions}
                        canFeature={!isUncat}
                        onPatch={patchPhoto}
                        onDelete={removePhoto} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Content tab — page text editing.
//
// Loads merged content from /api/admin/content (defaults + overrides),
// renders one section per editable area (Hero, Contact for now; About /
// Materials / CTAs come next phase). Saves go via PATCH section + updates.
//
// Empty-input → reset behaviour: leaving a field blank clears the
// override on the server, which makes the homepage fall back to the
// factory default. The "edited" hint disappears once the field matches
// the default.

// Field definitions per section. `key` matches the override field name on
// the server, `multiline` switches input → textarea, `hint` shows next to
// the label. Server defaults provide the placeholder text in each input.

const HERO_FIELDS = [
  { key: 'eyebrow',        label: 'Eyebrow',                hint: 'Thin amber pill above the headline' },
  { key: 'headlinePre',    label: 'Headline · part 1',      hint: 'Before the glitch word (e.g. "STAND OUT WITH")' },
  { key: 'headlineGlitch', label: 'Headline · glitch word', hint: 'The word that gets the glitch animation' },
  { key: 'headlinePost',   label: 'Headline · part 2',      hint: 'After the glitch word (e.g. "SIGNAGE")' },
  { key: 'lede',           label: 'Lede paragraph',         hint: 'Sub-headline. Use blank lines for breaks.', multiline: true, rows: 3 },
  { key: 'ctaPrimary',     label: 'Primary CTA label',      hint: 'Left button under the lede' },
  { key: 'ctaSecondary',   label: 'Secondary CTA label',    hint: 'Right button under the lede' }
];

const ABOUT_FIELDS = [
  { key: 'eyebrow',   label: 'Section eyebrow',  hint: 'Small label above the heading' },
  { key: 'titlePre',  label: 'Title · before',   hint: 'Plain text before the highlighted word(s)' },
  { key: 'titleGrad', label: 'Title · highlight', hint: 'The amber-gradient phrase in the middle' },
  { key: 'titlePost', label: 'Title · after',    hint: 'Plain text after the highlight (often just punctuation)' },
  { key: 'intro1',    label: 'Intro · paragraph 1', hint: 'First paragraph under the heading',  multiline: true, rows: 3 },
  { key: 'intro2',    label: 'Intro · paragraph 2', hint: 'Second paragraph under the heading', multiline: true, rows: 3 }
];

const SERVICES_INTRO_FIELDS = [
  { key: 'eyebrow', label: 'Section eyebrow', hint: 'Small label above the heading (e.g. "What we make")' },
  { key: 'title',   label: 'Section title',   hint: 'Big italic heading' },
  { key: 'intro',   label: 'Intro paragraph', hint: 'Lead paragraph under the heading', multiline: true, rows: 3 }
];

const MATERIALS_FIELDS = [
  { key: 'titlePre',  label: 'Heading · before',     hint: 'Plain text before the highlighted phrase' },
  { key: 'titleGrad', label: 'Heading · highlight',  hint: 'The amber-gradient phrase' },
  { key: 'titlePost', label: 'Heading · after',      hint: 'Plain text after the highlight (usually empty)' },
  { key: 'body1',     label: 'Body · paragraph 1',   hint: 'First paragraph next to the materials box', multiline: true, rows: 3 },
  { key: 'body2',     label: 'Body · paragraph 2',   hint: 'Second paragraph (often shorter)',           multiline: true, rows: 2 },
  { key: 'ctaLabel',  label: 'CTA button label',     hint: 'Button text linking to #contact' },
  { key: 'boxTitle',  label: 'Materials box header', hint: 'Heading inside the brand list (e.g. "Trusted materials")' }
];

const CONTACT_INTRO_FIELDS = [
  { key: 'eyebrow', label: 'Section eyebrow', hint: 'Small label above the heading' },
  { key: 'title',   label: 'Section title',   hint: 'Big italic heading' },
  { key: 'intro',   label: 'Intro paragraph', hint: 'Lead paragraph under the heading', multiline: true, rows: 3 }
];

const CONTACT_FIELDS = [
  { key: 'phone',     label: 'Phone',     hint: 'Displayed and used in tel: links' },
  { key: 'email',     label: 'Email',     hint: 'Displayed and used in mailto: links' },
  { key: 'address',   label: 'Address',   hint: 'Use a blank line to break onto two lines on the page', multiline: true, rows: 2 },
  { key: 'hours',     label: 'Hours',     hint: 'e.g. Mon–Fri · 8am–4pm' },
  { key: 'mapsQuery', label: 'Map query', hint: 'What the embedded Google Map searches for. Usually mirrors the address.' }
];

const REVIEWS_FIELDS = [
  { key: 'title',    label: 'Title',         hint: 'e.g. "Liked the work?"' },
  { key: 'sub',      label: 'Sub-text',      hint: 'One-line description under the title', multiline: true, rows: 2 },
  { key: 'ctaLabel', label: 'CTA label',     hint: 'Button text' },
  { key: 'ctaUrl',   label: 'CTA URL',       hint: 'Where the button links — usually a Google search/review URL' }
];

const BIG_CTA_FIELDS = [
  { key: 'eyebrow',  label: 'Eyebrow',  hint: 'Small label above the heading' },
  { key: 'title',    label: 'Heading',  hint: 'Big italic heading on the orange-edged card' },
  { key: 'body',     label: 'Body',     hint: 'One-line description under the heading', multiline: true, rows: 2 },
  { key: 'ctaLabel', label: 'CTA label', hint: 'Button text (e.g. "Try the quote tool →")' },
  { key: 'ctaUrl',   label: 'CTA link',  hint: 'Where the button goes. Default /quote (in-house quote tool). Use any internal route or external URL (https:// opens in a new tab; tel: / mailto: also work).' }
];

const FOOTER_FIELDS = [
  { key: 'tagline', label: 'Tagline', hint: 'Footer left side; the year auto-appends after a · separator' }
];

// Definition of every editable list section. `count` is the fixed slot
// count enforced by the server. `itemFields` is what each row exposes.
const PILLARS_FIELDS = [
  { key: 'key',  label: 'Label', hint: 'Short heading (e.g. "Materials")' },
  { key: 'body', label: 'Body',  hint: 'One-line description', multiline: true, rows: 2 }
];

const MATERIALS_ROWS_FIELDS = [
  { key: 'name',   label: 'Brand',     hint: 'Bold text shown when no logo is set (e.g. "AVERY")' },
  { key: 'detail', label: 'Detail',    hint: 'Small caption (e.g. "Cast vinyl")' },
  { key: 'logo',   label: 'Logo URL',  hint: 'Optional. Paste an image URL — homepage shows the logo (white-tinted) instead of the brand text. Source from each company’s press/brand-assets page; drop into /public/materials/ or upload via Photos and copy the blob URL.' }
];

// Per-slot fields for the customer review cards. Empty `text` →
// the slot is hidden on the homepage (the card just doesn't render),
// so admin can fill in 1, 2, or 3 reviews and the layout adapts.
const REVIEWS_LIST_FIELDS = [
  { key: 'text',   label: 'Quote',  hint: 'What the customer wrote. Leave blank to hide this slot from the homepage.', multiline: true, rows: 3 },
  { key: 'name',   label: 'Name',   hint: 'Attribution (e.g. "Sarah K." or "Pete @ Acme Auto")' },
  { key: 'rating', label: 'Rating', hint: '1–5. Renders as filled amber stars on the card.' },
  { key: 'source', label: 'Source', hint: 'Optional — "Google", "Word of mouth", etc.' }
];

function ContentTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [savingKey, setSavingKey] = useState(null); // 'hero' | 'contact' | null

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      // cache: 'no-store' so a PATCH-then-GET sequence doesn't hit a
      // browser-cached stale response and make saves look like they
      // didn't take.
      const r = await fetch('/api/admin/content', { credentials: 'same-origin', cache: 'no-store' });
      if (!r.ok) throw new Error(`Load failed (${r.status})`);
      const d = await r.json();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const saveSection = async (section, updates) => {
    setSavingKey(section);
    setError(null);
    try {
      const r = await fetch('/api/admin/content', {
        method: 'PATCH',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, updates })
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${r.status})`);
      }
      // PATCH now returns the full content shape ({ overrides, merged,
      // defaults, audit, rev }) — same as GET. Use it directly so we
      // don't have to do a second round-trip whose GET response could
      // have been served from browser cache (the bug that made saves
      // appear to revert).
      const fresh = await r.json();
      setData(fresh);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ color: BRAND.textDim }}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="ml-3 text-xs uppercase tracking-[0.25em]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Loading content…
        </span>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-start gap-2 p-3 text-sm"
          style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Section visibility — show/hide each major homepage block.
          Goes first so admin sees the panel before scrolling through
          all the per-section text editors. */}
      <VisibilityPanel
        merged={data.merged.visibility}
        overrides={data.overrides.visibility}
        saving={savingKey === 'visibility'}
        onSave={(updates) => saveSection('visibility', updates)}
      />

      <ContentSection
        title="Hero" subtitle="Top of the homepage — eyebrow, headline, lede, CTAs"
        fields={HERO_FIELDS}
        merged={data.merged.hero}     defaults={data.defaults.hero}
        overrides={data.overrides.hero}
        saving={savingKey === 'hero'} onSave={(u) => saveSection('hero', u)}
      />

      <ContentSection
        title="About" subtitle="Section 01 — eyebrow, headline, two intro paragraphs"
        fields={ABOUT_FIELDS}
        merged={data.merged.about}     defaults={data.defaults.about}
        overrides={data.overrides.about}
        saving={savingKey === 'about'} onSave={(u) => saveSection('about', u)}
      />

      <ListContentSection
        title="Pillars" subtitle="The 4 cards under About (Materials · Install · Design · Aftercare)"
        section="pillars"
        itemFields={PILLARS_FIELDS}
        merged={data.merged.pillars}     defaults={data.defaults.pillars}
        overrides={data.overrides.pillars}
        saving={savingKey === 'pillars'} onSave={(u) => saveSection('pillars', u)}
      />

      <ContentSection
        title="Services intro" subtitle="Section 02 header — above the 6 service tiles. (Tile titles + bodies are edited from the Photos tab.)"
        fields={SERVICES_INTRO_FIELDS}
        merged={data.merged.services_intro}     defaults={data.defaults.services_intro}
        overrides={data.overrides.services_intro}
        saving={savingKey === 'services_intro'} onSave={(u) => saveSection('services_intro', u)}
      />

      <ContentSection
        title="Materials block" subtitle="The two-column 'Premium materials. No shortcuts.' strip + the Trusted materials box header"
        fields={MATERIALS_FIELDS}
        merged={data.merged.materials}     defaults={data.defaults.materials}
        overrides={data.overrides.materials}
        saving={savingKey === 'materials'} onSave={(u) => saveSection('materials', u)}
      />

      <ListContentSection
        title="Materials rows" subtitle="The 6 brand entries inside the Trusted materials box"
        section="materials_rows"
        itemFields={MATERIALS_ROWS_FIELDS}
        merged={data.merged.materials_rows}     defaults={data.defaults.materials_rows}
        overrides={data.overrides.materials_rows}
        saving={savingKey === 'materials_rows'} onSave={(u) => saveSection('materials_rows', u)}
      />

      <ContentSection
        title="Contact intro" subtitle="Section 03 header — above the contact cards"
        fields={CONTACT_INTRO_FIELDS}
        merged={data.merged.contact_intro}     defaults={data.defaults.contact_intro}
        overrides={data.overrides.contact_intro}
        saving={savingKey === 'contact_intro'} onSave={(u) => saveSection('contact_intro', u)}
      />

      <ContentSection
        title="Contact info" subtitle="Phone, email, address, hours — used in the contact panel, footer, and CTA buttons"
        fields={CONTACT_FIELDS}
        merged={data.merged.contact}     defaults={data.defaults.contact}
        overrides={data.overrides.contact}
        saving={savingKey === 'contact'} onSave={(u) => saveSection('contact', u)}
      />

      <ContentSection
        title="Reviews — header + CTA"
        subtitle="Header text and Google CTA shown around the customer review cards"
        fields={REVIEWS_FIELDS}
        merged={data.merged.reviews}     defaults={data.defaults.reviews}
        overrides={data.overrides.reviews}
        saving={savingKey === 'reviews'} onSave={(u) => saveSection('reviews', u)}
      />

      <ListContentSection
        title="Reviews — customer cards"
        subtitle="3 slots for real customer reviews. Empty slots are hidden on the homepage; fill in 1, 2, or 3 and the layout adapts."
        section="reviews_list"
        itemFields={REVIEWS_LIST_FIELDS}
        merged={data.merged.reviews_list}     defaults={data.defaults.reviews_list}
        overrides={data.overrides.reviews_list}
        saving={savingKey === 'reviews_list'} onSave={(u) => saveSection('reviews_list', u)}
      />

      <ContentSection
        title="Big CTA card" subtitle="The orange-edged 'Get a real quote' card at the bottom of the contact section"
        fields={BIG_CTA_FIELDS}
        merged={data.merged.big_cta}     defaults={data.defaults.big_cta}
        overrides={data.overrides.big_cta}
        saving={savingKey === 'big_cta'} onSave={(u) => saveSection('big_cta', u)}
      />

      <ContentSection
        title="Footer" subtitle="Tagline on the left side of the footer — the year auto-appends"
        fields={FOOTER_FIELDS}
        merged={data.merged.footer}     defaults={data.defaults.footer}
        overrides={data.overrides.footer}
        saving={savingKey === 'footer'} onSave={(u) => saveSection('footer', u)}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Theme tab — brand colours + font choices.
//
// Colours are 3 hex values driving the amber→orange→yellow gradient
// used everywhere on the homepage. Native <input type="color"> opens
// the OS picker; alongside it a text input lets admin paste a hex
// value if they have a brand specification on hand.
//
// Fonts are dropdowns from a curated list (DISPLAY_FONT_OPTIONS /
// BODY_FONT_OPTIONS in services-meta.js). The homepage's Google Fonts
// loader watches the chosen pair and re-injects the link tag, so a
// save here triggers a font swap with no rebuild.

const THEME_FIELDS = [
  { key: 'amber',       label: 'Primary accent',   type: 'color', hint: 'Main brand colour — used on CTAs, links, accents' },
  { key: 'orange',      label: 'Gradient mid',     type: 'color', hint: 'Middle stop in the amber→orange→yellow gradient' },
  { key: 'yellow',      label: 'Gradient highlight', type: 'color', hint: 'Final stop — gives the gradient its glow' },
  { key: 'displayFont', label: 'Display font',     type: 'select', options: DISPLAY_FONT_OPTIONS, hint: 'Big italic headlines (hero, section titles)' },
  { key: 'bodyFont',    label: 'Body font',        type: 'select', options: BODY_FONT_OPTIONS,    hint: 'Paragraph text + regular UI copy' }
];

function ThemeTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/content', { credentials: 'same-origin', cache: 'no-store' });
      if (!r.ok) throw new Error(`Load failed (${r.status})`);
      setData(await r.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const save = async (updates) => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/content', {
        method: 'PATCH',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'theme', updates })
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${r.status})`);
      }
      setData(await r.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ color: BRAND.textDim }}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="ml-3 text-xs uppercase tracking-[0.25em]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Loading theme…
        </span>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 p-3 text-sm"
          style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <ThemeSection
        merged={data.merged.theme}
        defaults={data.defaults.theme}
        overrides={data.overrides.theme}
        saving={saving}
        onSave={save}
      />

      {/* Live preview — shows what the gradient looks like with the
          current saved values (not the in-progress drafts). Cheap way
          to confirm the save took without flipping back to the public
          site. */}
      <div className="p-5"
        style={{
          background: BRAND.navyRaise,
          border: `1px solid ${BRAND.navyLineStrong}`,
          borderTop: `2px solid ${BRAND.boltAmber}`
        }}>
        <div className="text-[10px] uppercase tracking-[0.25em] font-bold mb-3"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
          Live preview
        </div>
        <div style={{
          height: 80,
          background: `linear-gradient(135deg, ${data.merged.theme.amber}, ${data.merged.theme.orange}, ${data.merged.theme.yellow})`
        }} />
        <p className="text-xs mt-3" style={{ color: BRAND.textMuted }}>
          Display font sample: <span style={{
            fontFamily: `'${data.merged.theme.displayFont}', sans-serif`,
            fontWeight: 800,
            fontStyle: 'italic',
            fontSize: '24px',
            color: BRAND.textPri
          }}>STAND OUT WITH STRIKING SIGNAGE</span>
        </p>
        <p className="text-xs mt-2" style={{ color: BRAND.textMuted }}>
          Body font sample: <span style={{
            fontFamily: `'${data.merged.theme.bodyFont}', sans-serif`,
            color: BRAND.textPri
          }}>Custom signs, banners, decals, lightboxes, vehicle wraps and more.</span>
        </p>
      </div>
    </div>
  );
}

// One section for the Theme tab — handles colour + select fields
// alongside the regular text inputs ContentSection knows about. Same
// pattern: drafts in local state, "Save changes" commits to the
// server, "Reset all" clears every override.
function ThemeSection({ merged, defaults, overrides, saving, onSave }) {
  const buildDrafts = () => {
    const out = {};
    for (const f of THEME_FIELDS) out[f.key] = merged?.[f.key] ?? '';
    return out;
  };
  const [drafts, setDrafts] = useState(buildDrafts);
  useEffect(() => { setDrafts(buildDrafts()); }, [merged]); // eslint-disable-line

  const dirty = THEME_FIELDS.some(f => (drafts[f.key] ?? '') !== (merged[f.key] ?? ''));
  const overriddenCount = Object.keys(overrides || {}).length;

  const handleSave = () => {
    const updates = {};
    for (const f of THEME_FIELDS) {
      const draft = drafts[f.key] ?? '';
      const live  = merged[f.key] ?? '';
      if (draft === live) continue;
      const def = defaults[f.key] ?? '';
      // Empty string = clear the override → server falls back to default
      updates[f.key] = (draft.trim?.() === def) ? '' : draft;
    }
    if (Object.keys(updates).length === 0) return;
    onSave(updates);
  };
  const handleResetAll = () => {
    if (!overriddenCount) return;
    const updates = {};
    for (const k of Object.keys(overrides)) updates[k] = '';
    onSave(updates);
  };

  return (
    <section style={{
      background: BRAND.navyRaise,
      border: `1px solid ${BRAND.navyLineStrong}`,
      borderTop: `2px solid ${BRAND.boltAmber}`
    }}>
      <header className="px-5 py-4 flex items-baseline gap-3 flex-wrap"
        style={{ borderBottom: `1px solid ${BRAND.navyLine}` }}>
        <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: '1.4rem', letterSpacing: '0.02em', color: BRAND.textPri }}>
          Brand colours &amp; fonts
        </h3>
        <p className="text-sm flex-1 min-w-[260px]" style={{ color: BRAND.textMuted }}>
          The amber gradient + headline / body fonts. Saves apply to the
          live homepage instantly via CSS custom properties.
        </p>
        <span className="text-[10px] uppercase tracking-[0.22em]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
          {overriddenCount === 0 ? 'Showing factory defaults' : `${overriddenCount} field${overriddenCount === 1 ? '' : 's'} edited`}
        </span>
      </header>

      <div className="p-5 space-y-4">
        {THEME_FIELDS.map(f => {
          const v = drafts[f.key] ?? '';
          const def = defaults[f.key] ?? '';
          const isOverridden = (overrides || {})[f.key] !== undefined;
          return (
            <div key={f.key}>
              <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                <label className="text-[10px] uppercase tracking-[0.22em] font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  {f.label}
                </label>
                {isOverridden && (
                  <span className="text-[9px] uppercase tracking-[0.22em]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                    · edited
                  </span>
                )}
                <span className="text-[10px] ml-auto" style={{ color: BRAND.textFaint, fontStyle: 'italic' }}>
                  {f.hint}
                </span>
              </div>

              {f.type === 'color' ? (
                /* Native colour input + text mirror. Picker for
                   visual selection, hex text for paste-from-brand-doc. */
                <div className="flex items-center gap-3">
                  <input type="color" value={v || def}
                    onChange={e => setDrafts(d => ({ ...d, [f.key]: e.target.value }))}
                    style={{
                      width: 56, height: 40, padding: 0,
                      border: `1px solid ${BRAND.navyLineStrong}`,
                      background: 'rgba(8,21,46,0.6)', cursor: 'pointer',
                      borderRadius: 4
                    }} />
                  <input type="text" value={v}
                    onChange={e => setDrafts(d => ({ ...d, [f.key]: e.target.value }))}
                    placeholder={def}
                    spellCheck={false}
                    className="flex-1 px-3 py-2 text-sm outline-none"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'rgba(8,21,46,0.6)',
                      border: `1px solid ${BRAND.navyLineStrong}`,
                      color: BRAND.textPri
                    }} />
                </div>
              ) : f.type === 'select' ? (
                <select value={v || def}
                  onChange={e => setDrafts(d => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    background: 'rgba(8,21,46,0.6)',
                    border: `1px solid ${BRAND.navyLineStrong}`,
                    color: BRAND.textPri
                  }}>
                  {f.options.map(opt => (
                    <option key={opt} value={opt}
                      style={{ fontFamily: `'${opt}', sans-serif` }}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : null}

              {def && v !== def && (
                <button type="button"
                  onClick={() => setDrafts(d => ({ ...d, [f.key]: def }))}
                  className="text-[9px] uppercase tracking-[0.22em] mt-1 cursor-pointer"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: BRAND.textFaint,
                    background: 'transparent', border: 'none', padding: 0
                  }}>
                  Reset to default
                </button>
              )}
            </div>
          );
        })}

        <div className="flex items-center gap-3 pt-2"
          style={{ borderTop: `1px solid ${BRAND.navyLine}`, paddingTop: 16 }}>
          <button onClick={handleSave} disabled={!dirty || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: BRAND.boltGrad,
              color: BRAND.navy,
              fontFamily: 'Anton, sans-serif',
              letterSpacing: '0.1em',
              border: 'none'
            }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
            <span className="text-sm">{saving ? 'Saving…' : 'Save changes'}</span>
          </button>
          {overriddenCount > 0 && (
            <button onClick={handleResetAll} disabled={saving}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.22em] cursor-pointer disabled:opacity-40"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: 'transparent', color: BRAND.textMuted,
                border: `1px dashed ${BRAND.navyLineStrong}`
              }}>
              Reset all to defaults
            </button>
          )}
          {!dirty && !saving && (
            <span className="text-[10px] uppercase tracking-[0.22em]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
              No changes
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────
// Settings tab — site-wide config (browser title, meta description,
// quote email recipient). All flat text fields, so the existing
// ContentSection component handles it.

const SETTINGS_FIELDS = [
  { key: 'siteTitle',       label: 'Site title',       hint: 'Browser tab title + social share preview' },
  { key: 'metaDescription', label: 'Meta description', hint: 'SEO + social share blurb under the title', multiline: true, rows: 2 },
  { key: 'quoteEmail',      label: 'Quote email',      hint: 'Where the quote-tool form sends enquiries (must be a verified Resend address)' }
];

function SettingsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/content', { credentials: 'same-origin', cache: 'no-store' });
      if (!r.ok) throw new Error(`Load failed (${r.status})`);
      setData(await r.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); }, []);

  const save = async (updates) => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/content', {
        method: 'PATCH',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'settings', updates })
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${r.status})`);
      }
      setData(await r.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ color: BRAND.textDim }}>
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="ml-3 text-xs uppercase tracking-[0.25em]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Loading settings…
        </span>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 p-3 text-sm"
          style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <ContentSection
        title="Site settings"
        subtitle="Browser title, SEO description, quote-tool email recipient"
        fields={SETTINGS_FIELDS}
        merged={data.merged.settings}
        defaults={data.defaults.settings}
        overrides={data.overrides.settings}
        saving={saving}
        onSave={save}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Visibility panel — show / hide individual homepage sections.
//
// Defaults all sections visible (true). Admin flips a toggle to hide
// a section from the public homepage; the section's content stays in
// gallery.json so re-enabling restores it intact. Saves go through
// the same /api/admin/content PATCH path as the other content sections
// (section: 'visibility'), so PATCH-then-set-data-from-response works
// the same way — no separate cache concern.

const VISIBILITY_SECTIONS = [
  { key: 'hero',      label: 'Hero',            hint: 'Top of the homepage — eyebrow, headline, lede, CTAs, photo marquee' },
  { key: 'about',     label: 'About + pillars', hint: 'Section 01 + the four cards (Materials / Install / Design / Aftercare)' },
  { key: 'services',  label: 'Services',        hint: 'Section 02 + the six service tiles with photo galleries' },
  { key: 'materials', label: 'Materials strip', hint: '"Premium materials. No shortcuts." block + the brand list on the right' },
  { key: 'contact',   label: 'Contact section', hint: 'Section 03 + map + contact cards. Hides everything below — sub-blocks below are no-op when this is off.' },
  { key: 'reviews',   label: 'Reviews CTA',     hint: '"Liked the work?" Google review strip (only renders when Contact section is shown)' },
  { key: 'big_cta',   label: 'Big CTA card',    hint: '"Get a real quote" orange-edged card (only renders when Contact section is shown)' },
  { key: 'footer',    label: 'Footer',          hint: 'Tagline + contact links + the bolt admin shortcut' }
];

function VisibilityPanel({ merged, overrides, saving, onSave }) {
  // Local draft state: copy of the merged booleans. Sync on prop change
  // so a save from elsewhere doesn't leave us showing stale toggles.
  const buildDrafts = () => Object.fromEntries(
    VISIBILITY_SECTIONS.map(s => [s.key, merged?.[s.key] !== false])
  );
  const [drafts, setDrafts] = useState(buildDrafts);
  useEffect(() => { setDrafts(buildDrafts()); }, [merged]); // eslint-disable-line

  const dirty = VISIBILITY_SECTIONS.some(s => !!drafts[s.key] !== (merged?.[s.key] !== false));
  const hiddenCount = VISIBILITY_SECTIONS.filter(s => merged?.[s.key] === false).length;

  const handleSave = () => {
    const updates = {};
    for (const s of VISIBILITY_SECTIONS) {
      const wantVisible = !!drafts[s.key];
      const isVisible   = merged?.[s.key] !== false;
      if (wantVisible === isVisible) continue;
      // ON → empty string clears the override and the section uses the
      // default (true). OFF → explicit 'false' string stored.
      updates[s.key] = wantVisible ? '' : 'false';
    }
    if (Object.keys(updates).length === 0) return;
    onSave(updates);
  };

  const handleShowAll = () => {
    if (!Object.keys(overrides || {}).length) return;
    const updates = {};
    for (const k of Object.keys(overrides)) updates[k] = '';
    onSave(updates);
  };

  return (
    <section style={{
      background: BRAND.navyRaise,
      border: `1px solid ${BRAND.navyLineStrong}`,
      borderTop: `2px solid ${BRAND.boltAmber}`
    }}>
      <header className="px-5 py-4 flex items-baseline gap-3 flex-wrap"
        style={{ borderBottom: `1px solid ${BRAND.navyLine}` }}>
        <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: '1.4rem', letterSpacing: '0.02em', color: BRAND.textPri }}>
          Section visibility
        </h3>
        <p className="text-sm flex-1 min-w-[260px]" style={{ color: BRAND.textMuted }}>
          Hide individual sections from the public homepage without losing
          their content. Toggle back on any time to restore.
        </p>
        <span className="text-[10px] uppercase tracking-[0.22em]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
          {hiddenCount === 0
            ? 'All sections visible'
            : `${hiddenCount} hidden`}
        </span>
      </header>

      <div className="p-5">
        <ul className="space-y-2">
          {VISIBILITY_SECTIONS.map(s => {
            const isOn = !!drafts[s.key];
            const wasOn = merged?.[s.key] !== false;
            const isPending = isOn !== wasOn;
            return (
              <li key={s.key} className="flex items-start gap-3 px-3 py-2.5"
                style={{
                  background: isOn ? 'transparent' : 'rgba(127,29,29,0.12)',
                  border: `1px solid ${isOn ? BRAND.navyLine : '#7f1d1d40'}`
                }}>
                <button type="button"
                  onClick={() => setDrafts(d => ({ ...d, [s.key]: !d[s.key] }))}
                  disabled={saving}
                  aria-pressed={isOn}
                  title={isOn ? `Hide ${s.label}` : `Show ${s.label}`}
                  className="flex-shrink-0 inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                  style={{
                    width: 44, height: 24,
                    background: isOn ? BRAND.boltAmber : 'rgba(8,21,46,0.6)',
                    border: `1px solid ${isOn ? BRAND.boltAmber : BRAND.navyLineStrong}`,
                    borderRadius: 999,
                    position: 'relative',
                    transition: 'background-color .2s, border-color .2s'
                  }}>
                  {/* Thumb — slides between left (off) and right (on) */}
                  <span style={{
                    position: 'absolute',
                    top: 2, left: isOn ? 'auto' : 2, right: isOn ? 2 : 'auto',
                    width: 18, height: 18,
                    background: isOn ? BRAND.navy : BRAND.textMuted,
                    borderRadius: 999,
                    transition: 'left .15s, right .15s'
                  }} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isOn
                      ? <Eye className="w-3.5 h-3.5" style={{ color: BRAND.boltAmber }} strokeWidth={2} />
                      : <EyeOff className="w-3.5 h-3.5" style={{ color: BRAND.textFaint }} strokeWidth={2} />}
                    <span className="text-sm font-bold" style={{ color: BRAND.textPri }}>
                      {s.label}
                    </span>
                    {!isOn && (
                      <span className="text-[9px] uppercase tracking-[0.22em] px-1.5 py-0.5"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#fca5a5',
                          background: 'rgba(127,29,29,0.3)',
                          border: '1px solid #7f1d1d'
                        }}>
                        Hidden
                      </span>
                    )}
                    {isPending && (
                      <span className="text-[9px] uppercase tracking-[0.22em]"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                        · pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: BRAND.textFaint, lineHeight: 1.4 }}>
                    {s.hint}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3 pt-4 mt-4"
          style={{ borderTop: `1px solid ${BRAND.navyLine}` }}>
          <button onClick={handleSave} disabled={!dirty || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: BRAND.boltGrad,
              color: BRAND.navy,
              fontFamily: 'Anton, sans-serif',
              letterSpacing: '0.1em',
              border: 'none'
            }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
            <span className="text-sm">{saving ? 'Saving…' : 'Save changes'}</span>
          </button>
          {hiddenCount > 0 && (
            <button onClick={handleShowAll} disabled={saving}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.22em] cursor-pointer disabled:opacity-40"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: 'transparent',
                color: BRAND.textMuted,
                border: `1px dashed ${BRAND.navyLineStrong}`
              }}>
              Show all sections
            </button>
          )}
          {!dirty && !saving && (
            <span className="text-[10px] uppercase tracking-[0.22em]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
              No changes
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// One editable section (Hero or Contact). Holds local draft state for all
// its fields and only fires onSave when "Save changes" is clicked. That
// way admin can revise multiple fields before committing — and we don't
// thrash gallery.json on every keystroke.
function ContentSection({ title, subtitle, fields, merged, defaults, overrides, saving, onSave }) {
  // Initialise drafts from the merged values (default + override). When
  // `merged` updates after a save, sync drafts unless they're being edited.
  const [drafts, setDrafts] = useState(() => mergedToDrafts(fields, merged));
  useEffect(() => { setDrafts(mergedToDrafts(fields, merged)); }, [merged]); // eslint-disable-line

  // Diff drafts vs merged → only send changed fields
  const dirty = fields.some(f => (drafts[f.key] ?? '') !== (merged[f.key] ?? ''));

  const handleSave = () => {
    const updates = {};
    for (const f of fields) {
      const draft = drafts[f.key] ?? '';
      const live  = merged[f.key] ?? '';
      if (draft === live) continue;
      // If draft equals the factory default, send empty string → server clears override
      const def = defaults[f.key] ?? '';
      updates[f.key] = (draft.trim() === def) ? '' : draft;
    }
    if (Object.keys(updates).length === 0) return;
    onSave(updates);
  };

  const handleResetAll = () => {
    if (!Object.keys(overrides || {}).length) return;
    const updates = {};
    for (const k of Object.keys(overrides)) updates[k] = '';
    onSave(updates);
  };

  const overriddenCount = Object.keys(overrides || {}).length;

  return (
    <section style={{
      background: BRAND.navyRaise,
      border: `1px solid ${BRAND.navyLineStrong}`,
      borderTop: `2px solid ${BRAND.boltAmber}`
    }}>
      <header className="px-5 py-4 flex items-baseline gap-3 flex-wrap"
        style={{ borderBottom: `1px solid ${BRAND.navyLine}` }}>
        <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: '1.4rem', letterSpacing: '0.02em', color: BRAND.textPri }}>
          {title}
        </h3>
        <p className="text-sm flex-1 min-w-[260px]" style={{ color: BRAND.textMuted }}>
          {subtitle}
        </p>
        <span className="text-[10px] uppercase tracking-[0.22em]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
          {overriddenCount === 0
            ? 'Showing factory defaults'
            : `${overriddenCount} field${overriddenCount === 1 ? '' : 's'} edited`}
        </span>
      </header>

      <div className="p-5 space-y-4">
        {fields.map(f => {
          const v = drafts[f.key] ?? '';
          const def = defaults[f.key] ?? '';
          const isOverridden = (overrides || {})[f.key] !== undefined;
          return (
            <div key={f.key}>
              <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                <label className="text-[10px] uppercase tracking-[0.22em] font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  {f.label}
                </label>
                {isOverridden && (
                  <span className="text-[9px] uppercase tracking-[0.22em]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                    · edited
                  </span>
                )}
                <span className="text-[10px] ml-auto" style={{ color: BRAND.textFaint, fontStyle: 'italic' }}>
                  {f.hint}
                </span>
              </div>
              {f.multiline ? (
                <textarea value={v} rows={f.rows || 3}
                  onChange={e => setDrafts(d => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm outline-none resize-y"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    background: 'rgba(8,21,46,0.6)',
                    border: `1px solid ${BRAND.navyLineStrong}`,
                    color: BRAND.textPri
                  }} />
              ) : (
                <input value={v}
                  onChange={e => setDrafts(d => ({ ...d, [f.key]: e.target.value }))}
                  placeholder={def}
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    background: 'rgba(8,21,46,0.6)',
                    border: `1px solid ${BRAND.navyLineStrong}`,
                    color: BRAND.textPri
                  }} />
              )}
              {def && v !== def && (
                <button type="button"
                  onClick={() => setDrafts(d => ({ ...d, [f.key]: def }))}
                  className="text-[9px] uppercase tracking-[0.22em] mt-1 cursor-pointer"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: BRAND.textFaint,
                    background: 'transparent', border: 'none', padding: 0
                  }}>
                  Reset to default
                </button>
              )}
            </div>
          );
        })}

        <div className="flex items-center gap-3 pt-2" style={{ borderTop: `1px solid ${BRAND.navyLine}`, paddingTop: 16 }}>
          <button onClick={handleSave} disabled={!dirty || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: BRAND.boltGrad,
              color: BRAND.navy,
              fontFamily: 'Anton, sans-serif',
              letterSpacing: '0.1em',
              border: 'none'
            }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
            <span className="text-sm">{saving ? 'Saving…' : 'Save changes'}</span>
          </button>
          {overriddenCount > 0 && (
            <button onClick={handleResetAll} disabled={saving}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.22em] cursor-pointer disabled:opacity-40"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: 'transparent',
                color: BRAND.textMuted,
                border: `1px dashed ${BRAND.navyLineStrong}`
              }}>
              Reset all to defaults
            </button>
          )}
          {!dirty && !saving && (
            <span className="text-[10px] uppercase tracking-[0.22em]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
              No changes
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function mergedToDrafts(fields, merged) {
  const out = {};
  for (const f of fields) out[f.key] = merged?.[f.key] ?? '';
  return out;
}

// Editable list section — pillars, materials_rows. Fixed slot count;
// each row exposes the same set of itemFields. On save, sends the full
// array back to the server (PATCH section + array of slot objects).
// Empty fields stored as undefined → server uses default for that slot.
function ListContentSection({ title, subtitle, section, itemFields, merged, defaults, overrides, saving, onSave }) {
  // Drafts: parallel array, one entry per slot, each holds field drafts
  const buildDrafts = (rows) => (rows || []).map(r => {
    const o = {};
    for (const f of itemFields) o[f.key] = r?.[f.key] ?? '';
    return o;
  });
  const [drafts, setDrafts] = useState(() => buildDrafts(merged));
  useEffect(() => { setDrafts(buildDrafts(merged)); }, [merged]); // eslint-disable-line

  // Diff each row vs merged → any field different = dirty
  const dirty = drafts.some((row, i) => {
    const live = merged[i] || {};
    return itemFields.some(f => (row[f.key] ?? '') !== (live[f.key] ?? ''));
  });

  const handleSave = () => {
    // Send the full array. Each slot: send only the fields that don't
    // match the per-slot default (so the override storage stays sparse).
    const payload = drafts.map((row, i) => {
      const def = defaults[i] || {};
      const out = {};
      for (const f of itemFields) {
        const v = (row[f.key] ?? '').trim();
        if (v && v !== (def[f.key] ?? '')) out[f.key] = v;
      }
      return out;
    });
    onSave(payload);
  };

  const handleResetAll = () => {
    if (!overrides || overrides.length === 0) return;
    onSave([]);
  };

  const overriddenCount = (overrides || []).filter(o => o && Object.keys(o).length > 0).length;

  return (
    <section style={{
      background: BRAND.navyRaise,
      border: `1px solid ${BRAND.navyLineStrong}`,
      borderTop: `2px solid ${BRAND.boltAmber}`
    }}>
      <header className="px-5 py-4 flex items-baseline gap-3 flex-wrap"
        style={{ borderBottom: `1px solid ${BRAND.navyLine}` }}>
        <h3 style={{ fontFamily: 'Anton, sans-serif', fontSize: '1.4rem', letterSpacing: '0.02em', color: BRAND.textPri }}>
          {title}
        </h3>
        <p className="text-sm flex-1 min-w-[260px]" style={{ color: BRAND.textMuted }}>
          {subtitle}
        </p>
        <span className="text-[10px] uppercase tracking-[0.22em]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
          {overriddenCount === 0
            ? 'Showing factory defaults'
            : `${overriddenCount} of ${defaults.length} edited`}
        </span>
      </header>

      <div className="p-5 space-y-3">
        {drafts.map((row, i) => {
          const def = defaults[i] || {};
          const isOverridden = overrides && overrides[i] && Object.keys(overrides[i]).length > 0;
          return (
            <div key={i} className="p-3"
              style={{
                background: 'rgba(8,21,46,0.4)',
                border: `1px solid ${isOverridden ? BRAND.boltAmber + '40' : BRAND.navyLine}`,
                borderLeft: `3px solid ${isOverridden ? BRAND.boltAmber : BRAND.navyLineStrong}`
              }}>
              <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  Slot {String(i + 1).padStart(2, '0')}
                </span>
                {isOverridden && (
                  <span className="text-[9px] uppercase tracking-[0.22em]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                    · edited
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {itemFields.map(f => {
                  const v = row[f.key] ?? '';
                  const placeholder = def[f.key] ?? '';
                  return (
                    <div key={f.key}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <label className="text-[9px] uppercase tracking-[0.22em] font-bold"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                          {f.label}
                        </label>
                        <span className="text-[9px] ml-auto"
                          style={{ color: BRAND.textFaint, fontStyle: 'italic' }}>
                          {f.hint}
                        </span>
                      </div>
                      {f.multiline ? (
                        <textarea value={v} rows={f.rows || 2}
                          onChange={e => setDrafts(prev => {
                            const next = [...prev];
                            next[i] = { ...next[i], [f.key]: e.target.value };
                            return next;
                          })}
                          placeholder={placeholder}
                          className="w-full px-2.5 py-1.5 text-sm outline-none resize-y"
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            background: 'rgba(8,21,46,0.6)',
                            border: `1px solid ${BRAND.navyLineStrong}`,
                            color: BRAND.textPri
                          }} />
                      ) : (
                        <input value={v}
                          onChange={e => setDrafts(prev => {
                            const next = [...prev];
                            next[i] = { ...next[i], [f.key]: e.target.value };
                            return next;
                          })}
                          placeholder={placeholder}
                          className="w-full px-2.5 py-1.5 text-sm outline-none"
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            background: 'rgba(8,21,46,0.6)',
                            border: `1px solid ${BRAND.navyLineStrong}`,
                            color: BRAND.textPri
                          }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-3 pt-2"
          style={{ borderTop: `1px solid ${BRAND.navyLine}`, paddingTop: 16 }}>
          <button onClick={handleSave} disabled={!dirty || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: BRAND.boltGrad,
              color: BRAND.navy,
              fontFamily: 'Anton, sans-serif',
              letterSpacing: '0.1em',
              border: 'none'
            }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2.5} />}
            <span className="text-sm">{saving ? 'Saving…' : 'Save changes'}</span>
          </button>
          {overriddenCount > 0 && (
            <button onClick={handleResetAll} disabled={saving}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.22em] cursor-pointer disabled:opacity-40"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: 'transparent',
                color: BRAND.textMuted,
                border: `1px dashed ${BRAND.navyLineStrong}`
              }}>
              Reset all to defaults
            </button>
          )}
          {!dirty && !saving && (
            <span className="text-[10px] uppercase tracking-[0.22em]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
              No changes
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// Section header for one service group. Shows the group's number + name +
// description, all editable inline. Click the title to rename. Click
// "Edit description" to expand a textarea. "Reset" clears the override
// and reverts to the factory default.
function ServiceGroupHeader({ cat, merged, photoCount, hasCover, onSave }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [bodyOpen, setBodyOpen] = useState(false);
  const [bodyDraft, setBodyDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState(null);

  // Resolve current values from the live-merged services payload, falling
  // back to the static category defaults while content is still loading.
  const liveTitle = merged?.title || cat.title;
  const liveBody  = merged?.body  || cat.body;
  const defaultTitle = merged?.defaults?.title || cat.title;
  const defaultBody  = merged?.defaults?.body  || cat.body;
  const titleOverridden = liveTitle !== defaultTitle;
  const bodyOverridden  = liveBody  !== defaultBody;

  const beginEditTitle = () => { setError(null); setTitleDraft(liveTitle); setEditingTitle(true); };
  const cancelEditTitle = () => { setError(null); setEditingTitle(false); };
  const beginEditBody  = () => { setError(null); setBodyDraft(liveBody);  setBodyOpen(true);  };
  const cancelEditBody = () => { setError(null); setBodyOpen(false); };

  // Centralised save: returns the field value to send (empty string when
  // the draft equals the default = reset that override on the server).
  const doSave = async (field, draft, def) => {
    setError(null);
    setSaving(true);
    const trimmed = draft.trim();
    const valueToSend = trimmed === def ? '' : trimmed;
    const result = await onSave({ [field]: valueToSend });
    setSaving(false);
    if (!result || result.ok === false) {
      setError(result?.error || 'Save failed');
      return false;
    }
    // Brief "Saved" flash so admin gets visible confirmation
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
    return true;
  };

  const commitTitle = async () => {
    const trimmed = titleDraft.trim();
    if (trimmed === liveTitle) { setEditingTitle(false); return; }
    if (await doSave('title', titleDraft, defaultTitle)) setEditingTitle(false);
  };
  const commitBody = async () => {
    const trimmed = bodyDraft.trim();
    if (trimmed === liveBody) { setBodyOpen(false); return; }
    if (await doSave('body', bodyDraft, defaultBody)) setBodyOpen(false);
  };
  const resetTitle = async () => {
    if (await doSave('title', '', defaultTitle)) setEditingTitle(false);
  };
  const resetBody = async () => {
    if (await doSave('body', '', defaultBody)) setBodyOpen(false);
  };

  return (
    <header className="mb-3 pb-2" style={{ borderBottom: `1px solid ${BRAND.navyLine}` }}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-[0.25em] font-bold"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: BRAND.boltAmber, minWidth: 32
          }}>
          {cat.num}
        </span>
        {editingTitle ? (
          <>
            <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); commitTitle(); }
                if (e.key === 'Escape') cancelEditTitle();
              }}
              disabled={saving}
              className="text-base sm:text-lg px-2 py-1 outline-none flex-1 min-w-0"
              style={{
                fontFamily: 'Anton, sans-serif', letterSpacing: '0.02em',
                color: BRAND.textPri,
                background: 'rgba(8,21,46,0.6)',
                border: `1px solid ${BRAND.boltAmber}`
              }} />
            <button onClick={commitTitle} disabled={saving}
              title="Save (Enter)"
              className="inline-flex items-center gap-1 px-3 py-1.5 cursor-pointer disabled:opacity-50"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700,
                background: BRAND.boltAmber, color: BRAND.navy, border: 'none'
              }}>
              {saving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><Check className="w-3.5 h-3.5" strokeWidth={3} /> Save</>}
            </button>
            <button onClick={cancelEditTitle} disabled={saving}
              title="Cancel (Esc)"
              className="inline-flex items-center px-2 py-1.5 cursor-pointer disabled:opacity-50"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                background: 'transparent', color: BRAND.textMuted,
                border: `1px solid ${BRAND.navyLineStrong}`
              }}>
              Cancel
            </button>
            {titleOverridden && (
              <button onClick={resetTitle} disabled={saving}
                title="Clear override → revert to default"
                className="inline-flex items-center px-2 py-1.5 cursor-pointer disabled:opacity-50"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                  background: 'transparent', color: BRAND.textFaint,
                  border: `1px dashed ${BRAND.navyLineStrong}`
                }}>
                Reset
              </button>
            )}
          </>
        ) : (
          <>
            <h3 className="text-base sm:text-lg" style={{
              fontFamily: 'Anton, sans-serif', letterSpacing: '0.02em',
              color: BRAND.textPri, margin: 0
            }}>
              {liveTitle}
              {titleOverridden && (
                <span className="ml-2 text-[9px] uppercase tracking-[0.22em] align-middle"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  · edited
                </span>
              )}
            </h3>
            <button onClick={beginEditTitle}
              title="Rename this service group"
              className="inline-flex items-center gap-1 px-2 py-1 cursor-pointer"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700,
                background: 'transparent', color: BRAND.boltAmber,
                border: `1px solid ${BRAND.boltAmber}40`
              }}>
              Rename →
            </button>
          </>
        )}
        <span className="text-[10px] uppercase tracking-[0.22em] ml-auto"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
          {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
          {hasCover && (
            <span style={{ color: BRAND.boltAmber, marginLeft: 8 }}>· cover set</span>
          )}
          {!hasCover && photoCount > 0 && (
            <span style={{ color: '#fca5a5', marginLeft: 8 }}>· no cover</span>
          )}
          {savedFlash && !saving && (
            <span style={{ color: '#86efac', marginLeft: 8 }}>· saved ✓</span>
          )}
          {saving && (
            <Loader2 className="inline-block ml-2 w-3 h-3 animate-spin" style={{ color: BRAND.boltAmber }} />
          )}
        </span>
      </div>

      {/* Inline error — surfaces server-side validation problems so admin
          knows why a save didn't take, instead of silently reverting */}
      {error && (
        <div className="mt-2 ml-[44px] flex items-start gap-2 px-2 py-1.5 text-xs"
          style={{
            background: 'rgba(127,29,29,0.3)',
            border: '1px solid #7f1d1d',
            color: '#fca5a5'
          }}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Description / body. Collapsed by default — click "Edit description"
          to expand the textarea. Shown read-only otherwise. */}
      <div className="mt-2 pl-[44px]">
        {bodyOpen ? (
          <div>
            <textarea value={bodyDraft} onChange={e => setBodyDraft(e.target.value)}
              autoFocus rows={4}
              disabled={saving}
              onKeyDown={e => {
                if (e.key === 'Escape') cancelEditBody();
                // Cmd/Ctrl+Enter saves
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') commitBody();
              }}
              className="w-full px-3 py-2 text-sm outline-none resize-y"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: 'rgba(8,21,46,0.6)',
                border: `1px solid ${BRAND.boltAmber}`,
                color: BRAND.textPri,
                minHeight: 80
              }} />
            <div className="flex items-center gap-2 mt-1.5">
              <button onClick={commitBody} disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold cursor-pointer disabled:opacity-50"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: BRAND.boltAmber, color: BRAND.navy, border: 'none'
                }}>
                {saving
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <><Check className="w-3 h-3" strokeWidth={3} /> Save</>}
              </button>
              <button onClick={cancelEditBody} disabled={saving}
                className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] cursor-pointer disabled:opacity-50"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'transparent', color: BRAND.textMuted,
                  border: `1px solid ${BRAND.navyLineStrong}`
                }}>
                Cancel
              </button>
              {bodyOverridden && (
                <button onClick={resetBody} disabled={saving}
                  className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] cursor-pointer disabled:opacity-50 ml-auto"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: 'transparent', color: BRAND.textMuted,
                    border: `1px dashed ${BRAND.navyLineStrong}`
                  }}>
                  Reset to default
                </button>
              )}
            </div>
            <div className="text-[9px] uppercase tracking-[0.22em] mt-1.5"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
              Tip: Cmd/Ctrl + Enter to save · Esc to cancel
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-xs flex-1 min-w-[260px]" style={{
              color: BRAND.textMuted, lineHeight: 1.5,
              fontFamily: "'Outfit', sans-serif"
            }}>
              {liveBody}
              {bodyOverridden && (
                <span className="ml-1.5 text-[9px] uppercase tracking-[0.22em]"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                  · edited
                </span>
              )}
            </p>
            <button onClick={beginEditBody}
              className="text-[10px] uppercase tracking-[0.2em] cursor-pointer"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: BRAND.boltAmber, background: 'transparent', border: 'none', padding: 0
              }}>
              Edit description →
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function PhotoRow({ photo, labelSuggestions, categoryOptions, canFeature, onPatch, onDelete }) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(photo.label || '');
  // Per-row save state. `pendingCategory` and `pendingFeatured` are
  // optimistic — we set them the moment the user clicks/picks, so the UI
  // shows the new value instantly instead of snap-reverting to the stale
  // prop while the API call is in flight. The useEffects below clear them
  // once the photo prop catches up.
  const [saving, setSaving]                   = useState(false);
  const [savedFlash, setSavedFlash]           = useState(false);
  const [rowError, setRowError]               = useState(null);
  const [pendingCategory, setPendingCategory] = useState(null);
  const [pendingFeatured, setPendingFeatured] = useState(null);

  // Re-sync the input when the photo's label changes from outside
  // (e.g. another tab patched it). Cheap and avoids stale drafts.
  useEffect(() => { setLabelDraft(photo.label || ''); }, [photo.label]);

  // Clear optimistic overrides once the prop catches up to them — that's
  // when we know the server-confirmed state has propagated.
  useEffect(() => {
    if (pendingCategory !== null && (photo.category || '__uncat__') === pendingCategory) {
      setPendingCategory(null);
    }
  }, [photo.category, pendingCategory]);
  useEffect(() => {
    if (pendingFeatured !== null && !!photo.featured === pendingFeatured) {
      setPendingFeatured(null);
    }
  }, [photo.featured, pendingFeatured]);

  // Briefly highlight that the row was just saved
  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const runPatch = async (patch, optimistic) => {
    setRowError(null);
    setSaving(true);
    optimistic?.();
    const res = await onPatch(photo.id, patch);
    setSaving(false);
    if (res && res.ok === false) {
      setRowError(res.error || 'Save failed');
      // Revert optimistic state — props haven't changed, so clearing the
      // pending values lets the displayed value snap back to the actual.
      setPendingCategory(null);
      setPendingFeatured(null);
      return false;
    }
    flashSaved();
    return true;
  };

  const saveLabel = () => {
    const trimmed = labelDraft.trim();
    setEditingLabel(false);
    if (!trimmed || trimmed === photo.label) return;
    runPatch({ label: trimmed });
  };

  // Effective values for rendering — optimistic override wins while a save
  // is in flight, otherwise we read straight off the prop.
  const effCategory = pendingCategory !== null ? pendingCategory : (photo.category || '__uncat__');
  const effFeatured = pendingFeatured !== null ? pendingFeatured : !!photo.featured;

  const toggleFeatured = () => {
    if (!canFeature) return;
    const next = !effFeatured;
    runPatch(
      { featured: next },
      () => setPendingFeatured(next)
    );
  };

  const onCategoryChange = (val) => {
    runPatch(
      { category: val === '__uncat__' ? null : val },
      () => {
        setPendingCategory(val);
        // Server auto-clears featured on category change, so mirror that
        // optimistically — keeps the cover badge from flickering on.
        if (val !== (photo.category || '__uncat__')) setPendingFeatured(false);
      }
    );
  };

  return (
    <div className="flex gap-3 p-3"
      style={{
        background: 'rgba(8,21,46,0.55)',
        border: `1px solid ${effFeatured ? BRAND.boltAmber : (savedFlash ? '#86efac80' : BRAND.navyLine)}`,
        borderLeft: `3px solid ${effFeatured ? BRAND.boltAmber : BRAND.navyLineStrong}`,
        boxShadow: effFeatured ? `0 0 0 1px ${BRAND.boltAmber}40` : 'none',
        transition: 'border-color .3s'
      }}>
      <div className="flex-shrink-0 overflow-hidden relative"
        style={{ width: 96, height: 72, background: BRAND.navyDeep }}>
        <img src={photo.url} alt={photo.label}
          className="w-full h-full" loading="lazy"
          style={{ objectFit: 'cover', display: 'block', opacity: saving ? 0.6 : 1, transition: 'opacity .2s' }} />
        {effFeatured && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.2em] font-bold"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: BRAND.boltAmber,
              color: BRAND.navy
            }}>
            Cover
          </div>
        )}
        {saving && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(8,21,46,0.4)' }}>
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND.boltAmber }} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Service group dropdown — uses optimistic value while saving */}
        <select value={effCategory} onChange={e => onCategoryChange(e.target.value)}
          disabled={saving}
          className="w-full px-2 py-1 text-xs outline-none cursor-pointer disabled:opacity-60"
          style={{
            background: 'rgba(8,21,46,0.6)',
            border: `1px solid ${BRAND.navyLineStrong}`,
            color: BRAND.textPri,
            fontFamily: "'Outfit', sans-serif"
          }}>
          {(categoryOptions || CATEGORY_OPTIONS).map(c => (
            <option key={c.slug} value={c.slug}>{c.num} · {c.title}</option>
          ))}
        </select>

        {/* Label / caption */}
        {editingLabel ? (
          <div className="flex gap-1">
            <input value={labelDraft} onChange={e => setLabelDraft(e.target.value)}
              autoFocus list="label-suggestions"
              onKeyDown={e => { if (e.key === 'Enter') saveLabel(); if (e.key === 'Escape') setEditingLabel(false); }}
              onBlur={saveLabel}
              className="flex-1 px-2 py-1 text-xs outline-none min-w-0"
              style={{
                background: 'rgba(8,21,46,0.6)',
                border: `1px solid ${BRAND.boltAmber}`,
                color: BRAND.textPri,
                fontFamily: "'Outfit', sans-serif"
              }} />
            <button onMouseDown={(e) => { e.preventDefault(); saveLabel(); }}
              className="px-2 cursor-pointer"
              style={{ background: BRAND.boltAmber, color: BRAND.navy, border: 'none' }}>
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingLabel(true)}
            className="text-xs px-2 py-1 cursor-text text-left truncate"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: 'rgba(8,21,46,0.4)',
              border: `1px solid ${BRAND.navyLine}`,
              color: BRAND.textPri
            }}
            title="Click to edit caption">
            {photo.label || <span style={{ color: BRAND.textFaint }}>(no caption)</span>}
          </button>
        )}

        {/* Inline error if a per-row save failed */}
        {rowError && (
          <div className="flex items-start gap-1.5 px-2 py-1 text-[10px]"
            style={{
              background: 'rgba(127,29,29,0.3)',
              border: '1px solid #7f1d1d',
              color: '#fca5a5',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span className="break-all">{rowError}</span>
          </div>
        )}

        {/* Action row: set-cover toggle + delete */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <button onClick={toggleFeatured}
            disabled={!canFeature || saving}
            title={canFeature
              ? (effFeatured ? 'Unset as cover' : 'Set as the cover photo for this service')
              : 'Assign a service group first'}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: effFeatured ? `${BRAND.boltAmber}20` : 'rgba(8,21,46,0.4)',
              border: `1px solid ${effFeatured ? BRAND.boltAmber : BRAND.navyLineStrong}`,
              color: effFeatured ? BRAND.boltAmber : BRAND.textMuted,
              fontWeight: 700
            }}>
            <Star className="w-3 h-3"
              strokeWidth={2}
              fill={effFeatured ? BRAND.boltAmber : 'none'} />
            {effFeatured ? 'Cover' : 'Set cover'}
          </button>
          <div className="flex items-center gap-1.5">
            {photo.seed && (
              <span className="text-[9px] uppercase tracking-[0.18em]"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                seed
              </span>
            )}
            <button onClick={() => onDelete(photo.id)}
              title="Delete photo"
              className="inline-flex items-center justify-center w-7 h-7 cursor-pointer hover:bg-red-500/20"
              style={{ border: `1px solid ${BRAND.navyLineStrong}`, color: BRAND.textMuted }}>
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
