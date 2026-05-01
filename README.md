# Strike Print · Quote Estimator

Online quote and mock-up estimator. Customers upload a photo of their building, vehicle, or interior, drag signage templates onto it, tick off site conditions, and get an itemised quote with mockup.

No AI, no API keys, no backend. Pure client-side React + SVG composition.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Production build

```bash
npm run build
npm run preview
```

The static site lands in `dist/` — drop it on any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3, your own nginx).

## Deploy options

### Vercel (recommended — auto-deploys from GitHub)

1. Push this repo to GitHub
2. Go to https://vercel.com/new, select the repo
3. Vercel auto-detects Vite. Click Deploy
4. Live URL appears in ~30 seconds. Every push to `main` redeploys.

### Netlify

1. Push to GitHub
2. https://app.netlify.com/start → pick the repo
3. Build command: `npm run build` · Publish directory: `dist`

### Cloudflare Pages

1. Push to GitHub
2. https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
3. Build command: `npm run build` · Output directory: `dist`

### GitHub Pages

```bash
npm run build
# then push the dist folder to a `gh-pages` branch
```
You'll need to set `base: '/repo-name/'` in `vite.config.js` if hosting at `username.github.io/repo-name`.

## Pricing rules

All pricing lives in two config blocks at the top of `src/SignageQuote.jsx`:

- `SIGN_CATALOGUE` — per-product `perSqm`, `installBase`, `installPerSqm`, `minTotal` (or `flatPrice` for fixed-price items like A-frames and feather flags).
- `SITE_CONDITIONS` — flat-fee additions for things like lift hire, scaffolding, permits, electrical work, after-hours installs, travel surcharges, etc.

Edit the numbers, commit, push — Vercel/Netlify auto-redeploys. No rebuild step required from your side.

## Adding a new sign template

1. Add a pricing entry to `SIGN_CATALOGUE`
2. Add a render function to `SIGN_RENDERS` (returns a JSX `<svg>` with the look)
3. Add an entry to `TEMPLATE_LIBRARY` linking the two

That's it. The new template appears in the picker automatically.

## Adding a new site condition

Add an entry to `SITE_CONDITIONS`:

```js
new_rule: { label: 'Description shown to customer', line: 'Quote line item', cost: 999 }
```

Renders as a checkbox automatically. Ticked = added to the bill.

## License

All rights reserved · © Strike Print
