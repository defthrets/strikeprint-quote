# Strike Print · Squarespace Drop-in

Custom CSS + ready-made HTML snippets to give a Squarespace site the same
visual identity as the Vercel homepage. The quote tool is hosted offsite —
link to it from any button.

```
https://strikeprint-quote.vercel.app/quote
```

## Files

- **`strikeprint.css`** — paste into Custom CSS or Header code injection
- **`snippets.html`** — copy-paste HTML for hero, showcase strip, CTA card

## Install

### Step 1 — Add the CSS

Squarespace 7.1:

> **Design → Custom CSS** → paste the entire contents of `strikeprint.css`.

Or via Code Injection (whole-site):

> **Settings → Advanced → Code Injection → Header** → wrap the file
> contents in `<style>` ... `</style>` and paste.

The `@import` for Google Fonts (Anton, Bebas Neue, Outfit, JetBrains Mono)
works either way.

### Step 2 — Compose page sections

Add Squarespace **Code blocks** wherever you want the custom-styled hero,
photo strip, or CTA card. Paste the matching snippet from `snippets.html`.

### Step 3 — Wire up the quote button

Anywhere you have a "Get a Quote" button, set its link to:

```
https://strikeprint-quote.vercel.app/quote
```

Open in a new tab if you want the customer to keep your Squarespace site
in the original tab.

## Class reference

| Class                  | Use                                                 |
|------------------------|-----------------------------------------------------|
| `.sp-page`             | Wrap a single section if you don't want the body-wide background |
| `.sp-hero`             | Hero section wrapper. Drop `.sp-orb-a/b/c` inside as the first children |
| `.sp-orb-a/b/c`        | Drifting amber/orange/yellow background glow orbs |
| `.sp-headline`         | Big Anton headline. Wrap part of it in `<span class="sp-accent">` for the bolt-grad fill |
| `.sp-glitch`           | Add to a span for the periodic glitch animation (every ~8s) |
| `.sp-eyebrow`          | Small monospace amber label with side dashes |
| `.sp-divider-label`    | Smaller eyebrow with one dash on the left only |
| `.sp-tagline`          | Body text under the headline |
| `.sp-cta`              | Primary button (bolt-grad) |
| `.sp-cta-secondary`    | Outline button |
| `.sp-card`             | Generic content card |
| `.sp-cta-card`         | Big amber-bordered call-to-action card with pulsing glow |
| `.sp-showcase`         | Marquee wrapper |
| `.sp-showcase-track`   | Animated track — duplicate the cards inside for seamless loop |
| `.sp-showcase-card`    | Individual photo card in the strip |

## Customising

The brand palette is exposed as CSS custom properties at the top of the
file. Override them anywhere later in your CSS to retheme:

```css
:root {
  --sp-bolt-amber: #ffaa00;     /* slightly more yellow */
  --sp-bolt-grad:  linear-gradient(135deg, #ffaa00, #ff7a1f, #ffe600);
}
```

## Notes

- Photos for the showcase strip should be **WebP, max 1200px**, and uploaded
  to Squarespace's image manager (drag-drop into a Code block, copy the URL,
  paste into the snippet `src="..."`).
- The `.sp-glitch` animation respects `prefers-reduced-motion`.
- Squarespace's default site CSS is loaded *before* your custom CSS, so
  most overrides should "just work". If something doesn't take, append
  `!important` or wrap the rule in a more specific selector.
