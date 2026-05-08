// Plasmic loader + code-component registry.
//
// What this gives you:
//   - The Plasmic web editor (https://studio.plasmic.app) connects to this
//     site via /plasmic-host and treats our React components as draggable
//     building blocks.
//   - Pages designed in Plasmic can be fetched at runtime and rendered by
//     React Router (see main.jsx → /p/* route).
//   - Existing Home.jsx stays as-is; admin can build new pages in the
//     editor without touching code.
//
// Required env vars (Vite reads VITE_-prefixed vars at build time):
//   VITE_PLASMIC_PROJECT_ID   — UUID-style project id from Plasmic Studio
//   VITE_PLASMIC_PUBLIC_TOKEN — public API token for the project
//
// Both come from the Plasmic Studio: Project → Settings → Hosting / API tokens.
// The token is the one Mick provided; the project id needs to be set in
// .env.local locally and in Vercel project env vars for production builds.

import { initPlasmicLoader } from '@plasmicapp/loader-react';

const PROJECT_ID = import.meta.env.VITE_PLASMIC_PROJECT_ID;
const PUBLIC_TOKEN = import.meta.env.VITE_PLASMIC_PUBLIC_TOKEN;

// Don't crash the app if env vars are missing — just log and disable the
// loader so dev/prod still works while Plasmic is being set up.
const haveCreds = Boolean(PROJECT_ID && PUBLIC_TOKEN);
if (!haveCreds && typeof window !== 'undefined') {
  // Surface in the console once so it's discoverable but doesn't spam.
  // eslint-disable-next-line no-console
  console.info(
    '[plasmic] VITE_PLASMIC_PROJECT_ID / VITE_PLASMIC_PUBLIC_TOKEN not set — ' +
    'Plasmic-managed pages will return 404 until configured. ' +
    'Add them to .env.local for local dev and to Vercel env for production.'
  );
}

export const PLASMIC = haveCreds
  ? initPlasmicLoader({
      projects: [{ id: PROJECT_ID, token: PUBLIC_TOKEN }],
      // `false` so editor previews always pull the latest, including
      // unpublished drafts. Flip to `true` once you go live and want
      // the public site to read only published versions.
      preview: false
    })
  : null;

// ─── Code component registrations ────────────────────────────────
// These let the Plasmic editor treat our existing React components as
// draggable building blocks. Register more as you split Home.jsx into
// pieces you want admin-editable from the visual editor.
//
// Pattern: keep React code as the source of truth for behaviour and
// styling, expose props for content (text, image URLs, lists). The
// editor binds those props from Plasmic's UI.

import { HeroBlurb } from './plasmic-components/HeroBlurb.jsx';
import { ContactCard } from './plasmic-components/ContactCard.jsx';
import { ServiceTile } from './plasmic-components/ServiceTile.jsx';

if (PLASMIC) {
  PLASMIC.registerComponent(HeroBlurb, {
    name: 'HeroBlurb',
    importPath: './plasmic-components/HeroBlurb.jsx',
    props: {
      eyebrow:    { type: 'string', defaultValue: 'Western Sydney Signage' },
      headline:   { type: 'string', defaultValue: 'Striking signs, built to last.' },
      body:       { type: 'string', defaultValue: 'Custom signs, banners, decals, lightboxes, vehicle wraps and more.' },
      ctaLabel:   { type: 'string', defaultValue: 'Get a quote' },
      ctaHref:    { type: 'string', defaultValue: '/quote' }
    }
  });

  PLASMIC.registerComponent(ContactCard, {
    name: 'ContactCard',
    importPath: './plasmic-components/ContactCard.jsx',
    props: {
      phone:   { type: 'string', defaultValue: '+61 2 9000 0000' },
      email:   { type: 'string', defaultValue: 'mick@strikeprint.com.au' },
      address: { type: 'string', defaultValue: 'Arndell Park, Sydney' },
      hours:   { type: 'string', defaultValue: 'Mon–Fri · 7am – 4pm' }
    }
  });

  PLASMIC.registerComponent(ServiceTile, {
    name: 'ServiceTile',
    importPath: './plasmic-components/ServiceTile.jsx',
    props: {
      num:   { type: 'string', defaultValue: '01' },
      title: { type: 'string', defaultValue: 'Shopfront & Building Signs' },
      body:  { type: 'string', defaultValue: 'ACM panels, fascias and storefront signage.' },
      icon:  {
        type: 'choice',
        options: ['square', 'lightbulb', 'car', 'flag', 'eye', 'navigation'],
        defaultValue: 'square'
      }
    }
  });
}
