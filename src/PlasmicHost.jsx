// Plasmic Studio host page.
//
// The Plasmic editor (https://studio.plasmic.app) renders the design canvas
// inside an iframe pointed at this URL. It needs the loader to be initialized
// and the canvas-host SDK injected so it can do live render + drag-drop.
//
// Mount this at /plasmic-host and tell the Plasmic project (Settings →
// App hosting → External hosting URL) that the host URL is:
//   https://strikeprint-quote.vercel.app/plasmic-host
//
// For local dev: http://localhost:5173/plasmic-host

import React from 'react';
import { PlasmicCanvasHost } from '@plasmicapp/loader-react';
import { PLASMIC } from './plasmic-init.js';

export default function PlasmicHost() {
  if (!PLASMIC) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#08152e',
        color: '#cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px',
        padding: '40px',
        textAlign: 'center',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ color: '#f59a10', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '11px' }}>
          Plasmic not configured
        </div>
        <div>Set <code>VITE_PLASMIC_PROJECT_ID</code> and <code>VITE_PLASMIC_PUBLIC_TOKEN</code> in <code>.env.local</code>, then restart dev server.</div>
      </div>
    );
  }
  return <PlasmicCanvasHost />;
}
