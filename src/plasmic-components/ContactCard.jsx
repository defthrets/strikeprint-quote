// Plasmic-editable contact card. Drops onto any Plasmic page; the editor
// exposes phone / email / address / hours as text fields.

import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export function ContactCard({
  phone = '+61 2 9000 0000',
  email = 'mick@strikeprint.com.au',
  address = 'Arndell Park, Sydney',
  hours = 'Mon–Fri · 7am – 4pm'
}) {
  const rows = [
    { Icon: Phone,  label: phone,   href: `tel:${phone.replace(/\s/g, '')}` },
    { Icon: Mail,   label: email,   href: `mailto:${email}` },
    { Icon: MapPin, label: address, href: null },
    { Icon: Clock,  label: hours,   href: null }
  ];
  return (
    <div style={{
      background: 'var(--navy-card, rgba(8,21,46,0.95))',
      border: '1px solid var(--line, rgba(255,255,255,0.08))',
      borderRadius: '14px',
      padding: '28px',
      fontFamily: "'Inter Tight', sans-serif",
      color: 'var(--text, #f8fafc)',
      maxWidth: '420px'
    }}>
      {rows.map(({ Icon, label, href }, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '12px 0',
          borderBottom: i < rows.length - 1 ? '1px solid var(--line, rgba(255,255,255,0.08))' : 'none'
        }}>
          <Icon size={18} style={{ color: 'var(--amber, #f59a10)', flexShrink: 0 }} />
          {href ? (
            <a href={href} style={{ color: 'inherit', textDecoration: 'none', fontSize: '15px' }}>
              {label}
            </a>
          ) : (
            <span style={{ fontSize: '15px' }}>{label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default ContactCard;
