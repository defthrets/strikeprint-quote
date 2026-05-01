# Strike Print · Quote Estimator

Online quote and mock-up estimator. Customers upload a photo of their building, vehicle, or interior, drag signage templates onto it, tick off site conditions, and get an itemised quote with mockup.

Static client-side React + SVG composition, plus one tiny Vercel serverless function that dispatches the finished quote (mockup + original photo + breakdown) by email via Resend.

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

#### Email dispatch (Resend)

The `/api/send-quote` serverless function sends finished quotes to Strike
Print via [Resend](https://resend.com) (free tier: 3000/month). Setup:

1. Sign up at https://resend.com → grab an API key (`re_...`)
2. In Vercel: Project → Settings → Environment Variables, add:
   - `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
   - (optional) `QUOTE_RECIPIENT` — defaults to `mick@strikeprint.com.au`
   - (optional) `QUOTE_FROM` — defaults to `Strike Print Quotes <onboarding@resend.dev>`
3. Redeploy (any push, or hit "Redeploy" in the Vercel UI)

The default sender `onboarding@resend.dev` is Resend's sandbox address — it
will only deliver to the email address that owns the Resend account. So sign
up at Resend with `mick@strikeprint.com.au` and emails arrive there out of
the box. To send from a custom domain, verify `strikeprint.com.au` at
https://resend.com/domains and set `QUOTE_FROM` to a verified address.

Until `RESEND_API_KEY` is set, the form gracefully falls back to opening a
`mailto:` draft in the user's mail client.

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
