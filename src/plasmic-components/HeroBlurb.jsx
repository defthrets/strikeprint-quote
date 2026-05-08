// Plasmic-editable hero blurb. Headline + body + CTA — pure presentation,
// styling stays consistent with Home.jsx (Big Shoulders Display + Inter Tight).
//
// The editor exposes the props as text fields. Default values match the
// current Home.jsx hero so dropping this onto a Plasmic page renders
// identically to the homepage out of the box.

import React from 'react';

export function HeroBlurb({
  eyebrow = 'Western Sydney Signage',
  headline = 'Striking signs, built to last.',
  body = 'Custom signs, banners, decals, lightboxes, vehicle wraps and more.',
  ctaLabel = 'Get a quote',
  ctaHref = '/quote'
}) {
  return (
    <div style={{
      fontFamily: "'Inter Tight', sans-serif",
      color: 'var(--text, #f8fafc)',
      maxWidth: '720px'
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'var(--amber, #f59a10)',
        marginBottom: '18px'
      }}>
        {eyebrow}
      </div>
      <h1 style={{
        fontFamily: "'Big Shoulders Display', sans-serif",
        fontStyle: 'italic',
        fontWeight: 800,
        fontSize: 'clamp(44px, 8vw, 96px)',
        lineHeight: 0.95,
        margin: '0 0 24px',
        textTransform: 'uppercase'
      }}>
        {headline}
      </h1>
      <p style={{
        fontSize: '17px',
        lineHeight: 1.6,
        color: 'var(--muted, #cbd5e1)',
        marginBottom: '32px'
      }}>
        {body}
      </p>
      {ctaLabel && (
        <a
          href={ctaHref}
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: 'var(--grad, linear-gradient(135deg, #f59a10, #f0601f, #fad905))',
            color: '#08152e',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            borderRadius: '8px',
            textDecoration: 'none'
          }}
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
}

export default HeroBlurb;
