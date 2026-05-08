import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { upload } from '@vercel/blob/client';
import { Lock, LogOut, AlertTriangle, Loader2, ArrowLeft, Image as ImageIcon, Type, Palette, Settings, Upload, Trash2, Plus, Check, Star } from 'lucide-react';
import { LOGO_URL } from './logo.js';
import { SERVICE_CATEGORIES } from './services-meta.js';

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

const TABS = [
  { id: 'photos',   label: 'Photos',          icon: ImageIcon, ready: true,  status: 'Live' },
  { id: 'content',  label: 'Content',         icon: Type,      ready: true,  status: 'Live' },
  { id: 'theme',    label: 'Colours & fonts', icon: Palette,   ready: false, status: 'Phase 4' },
  { id: 'settings', label: 'Settings',        icon: Settings,  ready: false, status: 'Phase 4' }
];

function Dashboard() {
  const [tab, setTab] = useState('photos');
  const active = TABS.find(t => t.id === tab) || TABS[0];

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
        Edit the website without touching code. Photos live now — content,
        colours and settings come online over the next few deploys.
      </p>

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
      {active.id === 'photos'  && <PhotosTab />}
      {active.id === 'content' && <ContentTab />}
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
      const [photosRes, contentRes] = await Promise.all([
        fetch('/api/admin/photos',  { credentials: 'same-origin' }),
        fetch('/api/admin/content', { credentials: 'same-origin' })
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

  // Save service title/body overrides. Empty string = reset to default.
  const saveService = async (slug, fields) => {
    setError(null);
    try {
      const r = await fetch('/api/admin/content', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'services', updates: { [slug]: fields } })
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${r.status})`);
      }
      // Refresh just the merged services view (don't re-pull photos —
      // they're unchanged and refetching would flicker the grid).
      const contentRes = await fetch('/api/admin/content', { credentials: 'same-origin' });
      if (contentRes.ok) {
        const data = await contentRes.json();
        setServices(data?.merged?.services || []);
      }
    } catch (err) {
      setError(err.message);
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

  // Generic patch — sends whichever subset of { label, category, featured }
  // the caller provides. Server validates + atomically clears featured on
  // siblings when a new cover is set.
  const patchPhoto = async (id, patch) => {
    setError(null);
    try {
      const r = await fetch('/api/admin/photos', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch })
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Update failed (${r.status})`);
      }
      const data = await r.json();
      setPhotos([...(data.photos || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      setError(err.message);
    }
  };

  const removePhoto = async (id) => {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    setError(null);
    try {
      const r = await fetch('/api/admin/photos', {
        method: 'DELETE',
        credentials: 'same-origin',
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
            {CATEGORY_OPTIONS.map(c => (
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
  { key: 'eyebrow',  label: 'Eyebrow',          hint: 'Small label above the heading' },
  { key: 'title',    label: 'Heading',          hint: 'Big italic heading on the orange-edged card' },
  { key: 'body',     label: 'Body',             hint: 'One-line description under the heading', multiline: true, rows: 2 },
  { key: 'ctaLabel', label: 'CTA label prefix', hint: 'Phone number is auto-appended (e.g. "→ Call" becomes "→ Call 0422 626 286")' }
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
  { key: 'name',   label: 'Brand',  hint: 'Big text in the row (e.g. "AVERY")' },
  { key: 'detail', label: 'Detail', hint: 'Small caption (e.g. "Cast vinyl")' }
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
      const r = await fetch('/api/admin/content', { credentials: 'same-origin' });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, updates })
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${r.status})`);
      }
      await refresh();
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
        title="Reviews CTA" subtitle="The 'Liked the work?' strip with the Google review link"
        fields={REVIEWS_FIELDS}
        merged={data.merged.reviews}     defaults={data.defaults.reviews}
        overrides={data.overrides.reviews}
        saving={savingKey === 'reviews'} onSave={(u) => saveSection('reviews', u)}
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

  // Resolve current values from the live-merged services payload, falling
  // back to the static category defaults while content is still loading.
  const liveTitle = merged?.title || cat.title;
  const liveBody  = merged?.body  || cat.body;
  const defaultTitle = merged?.defaults?.title || cat.title;
  const defaultBody  = merged?.defaults?.body  || cat.body;
  const titleOverridden = liveTitle !== defaultTitle;
  const bodyOverridden  = liveBody  !== defaultBody;

  const beginEditTitle = () => { setTitleDraft(liveTitle); setEditingTitle(true); };
  const beginEditBody  = () => { setBodyDraft(liveBody);   setBodyOpen(true);     };

  const commitTitle = async () => {
    setEditingTitle(false);
    const trimmed = titleDraft.trim();
    // No change → no API call. Empty resets to default (server clears the override).
    if (trimmed === liveTitle) return;
    setSaving(true);
    await onSave({ title: trimmed === defaultTitle ? '' : trimmed });
    setSaving(false);
  };

  const commitBody = async () => {
    const trimmed = bodyDraft.trim();
    setBodyOpen(false);
    if (trimmed === liveBody) return;
    setSaving(true);
    await onSave({ body: trimmed === defaultBody ? '' : trimmed });
    setSaving(false);
  };

  const resetTitle = async () => {
    setEditingTitle(false);
    setSaving(true);
    await onSave({ title: '' });
    setSaving(false);
  };
  const resetBody = async () => {
    setBodyOpen(false);
    setSaving(true);
    await onSave({ body: '' });
    setSaving(false);
  };

  return (
    <header className="mb-3 pb-2" style={{ borderBottom: `1px solid ${BRAND.navyLine}` }}>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-[10px] uppercase tracking-[0.25em] font-bold"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: BRAND.boltAmber, minWidth: 32
          }}>
          {cat.num}
        </span>
        {editingTitle ? (
          <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter')  commitTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            onBlur={commitTitle}
            className="text-base sm:text-lg px-2 py-1 outline-none flex-1 min-w-0"
            style={{
              fontFamily: 'Anton, sans-serif', letterSpacing: '0.02em',
              color: BRAND.textPri,
              background: 'rgba(8,21,46,0.6)',
              border: `1px solid ${BRAND.boltAmber}`
            }} />
        ) : (
          <button onClick={beginEditTitle}
            className="text-base sm:text-lg cursor-pointer text-left"
            title="Click to rename this service group"
            style={{
              fontFamily: 'Anton, sans-serif', letterSpacing: '0.02em',
              color: BRAND.textPri, background: 'transparent', border: 'none', padding: 0
            }}>
            {liveTitle}
            {titleOverridden && (
              <span className="ml-2 text-[9px] uppercase tracking-[0.22em] align-middle"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
                · edited
              </span>
            )}
          </button>
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
          {saving && (
            <Loader2 className="inline-block ml-2 w-3 h-3 animate-spin" style={{ color: BRAND.boltAmber }} />
          )}
        </span>
      </div>

      {/* Description / body. Collapsed by default — click "Edit description"
          to expand the textarea. Shown read-only otherwise. */}
      <div className="mt-2 pl-[44px]">
        {bodyOpen ? (
          <div>
            <textarea value={bodyDraft} onChange={e => setBodyDraft(e.target.value)}
              autoFocus rows={4}
              onKeyDown={e => {
                if (e.key === 'Escape') setBodyOpen(false);
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
              <button onClick={commitBody}
                className="inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold cursor-pointer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: BRAND.boltAmber, color: BRAND.navy, border: 'none'
                }}>
                <Check className="w-3 h-3" strokeWidth={3} />
                Save
              </button>
              <button onClick={() => setBodyOpen(false)}
                className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] cursor-pointer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'transparent', color: BRAND.textMuted,
                  border: `1px solid ${BRAND.navyLineStrong}`
                }}>
                Cancel
              </button>
              {bodyOverridden && (
                <button onClick={resetBody}
                  className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] cursor-pointer ml-auto"
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
              Tip: Cmd/Ctrl + Enter to save · Esc to cancel · Empty resets to default
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

function PhotoRow({ photo, labelSuggestions, canFeature, onPatch, onDelete }) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(photo.label || '');

  // Re-sync the input when the photo's label changes from outside
  // (e.g. another tab patched it). Cheap and avoids stale drafts.
  useEffect(() => { setLabelDraft(photo.label || ''); }, [photo.label]);

  const saveLabel = () => {
    const trimmed = labelDraft.trim();
    if (trimmed && trimmed !== photo.label) onPatch(photo.id, { label: trimmed });
    setEditingLabel(false);
  };

  const isFeatured = !!photo.featured;
  const toggleFeatured = () => {
    if (!canFeature) return;
    onPatch(photo.id, { featured: !isFeatured });
  };

  const onCategoryChange = (val) => {
    onPatch(photo.id, { category: val === '__uncat__' ? null : val });
  };

  return (
    <div className="flex gap-3 p-3"
      style={{
        background: 'rgba(8,21,46,0.55)',
        border: `1px solid ${isFeatured ? BRAND.boltAmber : BRAND.navyLine}`,
        borderLeft: `3px solid ${isFeatured ? BRAND.boltAmber : BRAND.navyLineStrong}`,
        boxShadow: isFeatured ? `0 0 0 1px ${BRAND.boltAmber}40` : 'none'
      }}>
      <div className="flex-shrink-0 overflow-hidden relative"
        style={{ width: 96, height: 72, background: BRAND.navyDeep }}>
        <img src={photo.url} alt={photo.label}
          className="w-full h-full" loading="lazy"
          style={{ objectFit: 'cover', display: 'block' }} />
        {isFeatured && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.2em] font-bold"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: BRAND.boltAmber,
              color: BRAND.navy
            }}>
            Cover
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Service group dropdown */}
        <select value={photo.category || '__uncat__'} onChange={e => onCategoryChange(e.target.value)}
          className="w-full px-2 py-1 text-xs outline-none cursor-pointer"
          style={{
            background: 'rgba(8,21,46,0.6)',
            border: `1px solid ${BRAND.navyLineStrong}`,
            color: BRAND.textPri,
            fontFamily: "'Outfit', sans-serif"
          }}>
          {CATEGORY_OPTIONS.map(c => (
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

        {/* Action row: set-cover toggle + delete */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <button onClick={toggleFeatured}
            disabled={!canFeature}
            title={canFeature
              ? (isFeatured ? 'Unset as cover' : 'Set as the cover photo for this service')
              : 'Assign a service group first'}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: isFeatured ? `${BRAND.boltAmber}20` : 'rgba(8,21,46,0.4)',
              border: `1px solid ${isFeatured ? BRAND.boltAmber : BRAND.navyLineStrong}`,
              color: isFeatured ? BRAND.boltAmber : BRAND.textMuted,
              fontWeight: 700
            }}>
            <Star className="w-3 h-3"
              strokeWidth={2}
              fill={isFeatured ? BRAND.boltAmber : 'none'} />
            {isFeatured ? 'Cover' : 'Set cover'}
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
