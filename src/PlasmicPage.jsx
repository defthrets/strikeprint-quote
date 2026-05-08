// Renders a Plasmic-managed page by slug.
//
// Routing: main.jsx maps /p/* → this component. The slug after /p/ is
// looked up in the Plasmic project; if it exists, it's rendered;
// otherwise we fall through to the Home component (catch-all behaviour
// matches the rest of the app).
//
// This is the bridge that lets admin build pages in Plasmic Studio
// without ever touching code — publish the page in Studio, navigate to
// /p/<slug>, and it appears.

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PlasmicComponent, PlasmicRootProvider } from '@plasmicapp/loader-react';
import { PLASMIC } from './plasmic-init.js';
import Home from './Home.jsx';

export default function PlasmicPage() {
  const location = useLocation();
  // /p/<slug> → "<slug>". Empty slug ("/p" or "/p/") means the project's
  // root page, by Plasmic convention "/".
  const slug = location.pathname.replace(/^\/p\/?/, '') || '/';
  const lookupPath = slug === '/' ? '/' : '/' + slug;

  const [pageMeta, setPageMeta] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!PLASMIC) {
      setPageMeta(null);
      return;
    }
    PLASMIC.maybeFetchComponentData(lookupPath)
      .then(data => { if (!cancelled) setPageMeta(data ?? null); })
      .catch(() => { if (!cancelled) setPageMeta(null); });
    return () => { cancelled = true; };
  }, [lookupPath]);

  // Loading
  if (pageMeta === undefined) {
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
        Loading…
      </div>
    );
  }

  // Page not found in Plasmic — render the homepage (acts as a graceful
  // fallback while pages are being built in the editor).
  if (!pageMeta || !PLASMIC) {
    return <Home />;
  }

  return (
    <PlasmicRootProvider loader={PLASMIC} prefetchedData={pageMeta}>
      <PlasmicComponent component={lookupPath} />
    </PlasmicRootProvider>
  );
}
