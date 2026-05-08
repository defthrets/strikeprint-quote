import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { upload } from '@vercel/blob/client';
import { Lock, LogOut, AlertTriangle, Loader2, ArrowLeft, Image as ImageIcon, Type, Palette, Settings, Upload, Trash2, Plus, Check } from 'lucide-react';
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

const TABS = [
  { id: 'photos',   label: 'Photos',          icon: ImageIcon, ready: true,  status: 'Live' },
  { id: 'content',  label: 'Content',         icon: Type,      ready: false, status: 'Phase 3' },
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
      {active.id === 'photos' && <PhotosTab />}
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

// Distinct categories shown in the label dropdown when adding/editing photos.
// 'Other…' opens a free-text input so admin can add a brand-new category
// on the fly — anything typed becomes the photo's label and joins the list
// next time the page renders (computed from the live photos array).
const SEED_CATEGORIES = [
  'Storefront signage', 'Wall graphics', 'Wall mural', 'Privacy film',
  'Vending wrap', 'Vehicle wrap', 'Lightbox', 'Panels & acrylics',
  'Bar graphics', 'Banners', 'Tradie signage', 'Hanging fabric banners',
  'Window vinyl graphics', 'Custom vinyl', 'Custom privacy frosting',
  'Inhouse production', 'Panels and promotional'
];

function PhotosTab() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [defaultLabel, setDefaultLabel] = useState('Storefront signage');
  const fileInputRef = useRef(null);

  // Categories present in the live photo list, unioned with the seed list,
  // de-duplicated. Lets admin pick from existing labels OR types a new one.
  const liveCategories = Array.from(new Set(photos.map(p => p.label).filter(Boolean)));
  const allCategories = Array.from(new Set([...SEED_CATEGORIES, ...liveCategories])).sort();

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/photos', { credentials: 'same-origin' });
      if (!r.ok) throw new Error(`Load failed (${r.status})`);
      const data = await r.json();
      const sorted = [...(data.photos || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setPhotos(sorted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

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
      // Register in gallery.json
      const r = await fetch('/api/admin/photos', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blob.url, label: defaultLabel })
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

  const updateLabel = async (id, label) => {
    setError(null);
    try {
      const r = await fetch('/api/admin/photos', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label })
      });
      if (!r.ok) throw new Error('Update failed');
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
      <div className="p-4 sm:p-5 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
        style={{
          background: BRAND.navyRaise,
          border: `1px solid ${BRAND.navyLineStrong}`,
          borderTop: `2px solid ${BRAND.boltAmber}`
        }}>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] mb-1"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.boltAmber }}>
            Default label for new photos
          </div>
          <select value={defaultLabel} onChange={e => setDefaultLabel(e.target.value)}
            disabled={uploading}
            className="w-full px-3 py-2 text-sm outline-none"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: 'rgba(8,21,46,0.6)',
              border: `1px solid ${BRAND.navyLineStrong}`,
              color: BRAND.textPri
            }}>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={onUpload}
          disabled={uploading} className="hidden" />

        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Photo grid */}
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
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
            {photos.length} photos · sorted by order
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {photos.map(p => (
              <PhotoRow key={p.id} photo={p} categories={allCategories}
                onLabel={updateLabel} onDelete={removePhoto} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoRow({ photo, categories, onLabel, onDelete }) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [customLabel, setCustomLabel] = useState('');

  const onSelect = (val) => {
    if (val === '__custom__') {
      setEditingLabel(true);
      setCustomLabel(photo.label || '');
      return;
    }
    onLabel(photo.id, val);
  };

  const saveCustom = () => {
    const trimmed = customLabel.trim();
    if (trimmed && trimmed !== photo.label) onLabel(photo.id, trimmed);
    setEditingLabel(false);
  };

  return (
    <div className="flex gap-3 p-3"
      style={{
        background: 'rgba(8,21,46,0.55)',
        border: `1px solid ${BRAND.navyLine}`,
        borderLeft: `3px solid ${BRAND.boltAmber}`
      }}>
      <div className="flex-shrink-0 overflow-hidden"
        style={{ width: 96, height: 72, background: BRAND.navyDeep }}>
        <img src={photo.url} alt={photo.label}
          className="w-full h-full" loading="lazy"
          style={{ objectFit: 'cover', display: 'block' }} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] mb-1"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textDim }}>
            Label {photo.seed && <span style={{ color: BRAND.boltAmber }}>· seed</span>}
          </div>

          {editingLabel ? (
            <div className="flex gap-1">
              <input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') saveCustom(); if (e.key === 'Escape') setEditingLabel(false); }}
                className="flex-1 px-2 py-1.5 text-sm outline-none"
                style={{
                  background: 'rgba(8,21,46,0.6)',
                  border: `1px solid ${BRAND.boltAmber}`,
                  color: BRAND.textPri,
                  fontFamily: "'Outfit', sans-serif"
                }} />
              <button onClick={saveCustom}
                className="px-2 cursor-pointer"
                style={{ background: BRAND.boltAmber, color: BRAND.navy, border: 'none' }}>
                <Check className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          ) : (
            <select value={categories.includes(photo.label) ? photo.label : '__custom__'}
              onChange={e => onSelect(e.target.value)}
              className="w-full px-2 py-1.5 text-sm outline-none cursor-pointer"
              style={{
                background: 'rgba(8,21,46,0.6)',
                border: `1px solid ${BRAND.navyLineStrong}`,
                color: BRAND.textPri,
                fontFamily: "'Outfit', sans-serif"
              }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              {!categories.includes(photo.label) && (
                <option value={photo.label}>{photo.label} (custom)</option>
              )}
              <option value="__custom__">Other / custom…</option>
            </select>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] uppercase tracking-[0.2em]"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: BRAND.textFaint }}>
            #{(photo.order ?? 0) + 1}
          </span>
          <button onClick={() => onDelete(photo.id)}
            title="Delete photo"
            className="inline-flex items-center justify-center w-7 h-7 cursor-pointer hover:bg-red-500/20"
            style={{ border: `1px solid ${BRAND.navyLineStrong}`, color: BRAND.textMuted }}>
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
