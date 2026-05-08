// Plasmic-editable service tile. Used to compose the services row in the
// Plasmic editor — drag in 6 of these, set num/title/body/icon for each.

import React from 'react';
import { Square, Lightbulb, Car, Flag, Eye, Navigation } from 'lucide-react';

const ICONS = {
  square: Square,
  lightbulb: Lightbulb,
  car: Car,
  flag: Flag,
  eye: Eye,
  navigation: Navigation
};

export function ServiceTile({
  num = '01',
  title = 'Shopfront & Building Signs',
  body = 'ACM panels, fascias and storefront signage.',
  icon = 'square'
}) {
  const Icon = ICONS[icon] || Square;
  return (
    <div style={{
      background: 'var(--navy-raise, rgba(15,32,70,0.7))',
      border: '1px solid var(--line, rgba(255,255,255,0.08))',
      borderRadius: '14px',
      padding: '32px',
      fontFamily: "'Inter Tight', sans-serif",
      color: 'var(--text, #f8fafc)',
      transition: 'transform 200ms ease, border-color 200ms ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          letterSpacing: '0.25em',
          color: 'var(--amber, #f59a10)'
        }}>
          {num}
        </span>
        <Icon size={24} style={{ color: 'var(--amber, #f59a10)' }} />
      </div>
      <h3 style={{
        fontFamily: "'Big Shoulders Display', sans-serif",
        fontStyle: 'italic',
        fontWeight: 700,
        fontSize: '24px',
        textTransform: 'uppercase',
        margin: 0,
        lineHeight: 1.05
      }}>
        {title}
      </h3>
      <p style={{
        color: 'var(--muted, #cbd5e1)',
        fontSize: '15px',
        lineHeight: 1.55,
        margin: 0
      }}>
        {body}
      </p>
    </div>
  );
}

export default ServiceTile;
