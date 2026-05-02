import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import './index.css';

// The quote tool is large (~240KB JS). Lazy-load it so visitors who only
// see the homepage don't pay for the editor bundle until they navigate.
const SignageQuote = lazy(() => import('./SignageQuote.jsx'));
// Gallery imports SHOWCASE_PHOTOS from Home — small enough to bundle
// directly with the main chunk, no separate lazy import.
const Gallery = lazy(() => import('./Gallery.jsx'));
const About   = lazy(() => import('./About.jsx'));

// Brief loading state while a lazy chunk fetches. Matches the dark navy
// background so it doesn't flash white during the route transition. The
// label is passed in so each route's spinner names the right thing.
function RouteLoading({ label }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#08152e',
      color: '#94a3b8',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '11px',
      letterSpacing: '0.25em',
      textTransform: 'uppercase'
    }}>
      Loading {label}…
    </div>
  );
}

// Backward-compat: before the homepage existed, the quote tool lived at the
// bare domain and saved-quote share links looked like `/#q=...`. Redirect
// those to `/quote#q=...` so old links still restore correctly.
if (typeof window !== 'undefined' &&
    window.location.pathname === '/' &&
    window.location.hash.startsWith('#q=')) {
  window.history.replaceState(null, '', '/quote' + window.location.hash);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={
          <Suspense fallback={<RouteLoading label="gallery" />}>
            <Gallery />
          </Suspense>
        } />
        <Route path="/about" element={
          <Suspense fallback={<RouteLoading label="about" />}>
            <About />
          </Suspense>
        } />
        <Route path="/quote" element={
          <Suspense fallback={<RouteLoading label="quote tool" />}>
            <SignageQuote />
          </Suspense>
        } />
        {/* Catch-all redirects to home — Vercel's SPA rewrite hands every
            unmatched path to index.html and React Router resolves from there. */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
