// Vercel serverless function: POST /api/send-quote
// Receives the customer form + breakdown + base64 mockup/original photos,
// and sends a transactional email to Strike Print via the Resend HTTP API.
//
// Required env var (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY    — get from https://resend.com (free 3000/mo)
// Optional:
//   QUOTE_FROM        — sender, default 'Strike Print Quotes <onboarding@resend.dev>'
//   QUOTE_RECIPIENT   — recipient, default 'mick@strikeprint.com.au'
//
// Note on the default sender: 'onboarding@resend.dev' is Resend's sandbox
// address. It will only deliver to the email address that owns the Resend
// account — which for Strike Print is mick@strikeprint.com.au, so this works
// out of the box. To send to other recipients (or to use a custom From),
// verify a domain at resend.com/domains and set QUOTE_FROM.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const stripDataUrl = (s) => {
  if (!s || typeof s !== 'string') return null;
  const i = s.indexOf('base64,');
  return i === -1 ? null : s.slice(i + 'base64,'.length);
};

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'Email service not configured (missing RESEND_API_KEY)' });
  }

  const sender    = process.env.QUOTE_FROM      || 'Strike Print Quotes <onboarding@resend.dev>';
  const recipient = process.env.QUOTE_RECIPIENT || 'mick@strikeprint.com.au';

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const {
    customer_name    = '',
    customer_phone   = '',
    customer_email   = '',
    customer_message = '',
    quote_total      = '',
    quote_breakdown  = '',
    mockup_dataurl   = '',
    original_dataurl = ''
  } = body;

  if (!customer_name.trim() || (!customer_phone.trim() && !customer_email.trim())) {
    return res.status(400).json({ error: 'Missing required fields (name + phone or email)' });
  }

  const attachments = [];
  const mockupB64   = stripDataUrl(mockup_dataurl);
  const originalB64 = stripDataUrl(original_dataurl);
  if (mockupB64)   attachments.push({ filename: 'mockup.jpg',   content: mockupB64 });
  if (originalB64) attachments.push({ filename: 'original.jpg', content: originalB64 });

  const html = `
<div style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;color:#0f1729;max-width:640px">
  <div style="background:#08152e;color:#fad905;padding:14px 18px;font-family:Arial Black,Impact,sans-serif;letter-spacing:0.06em;font-size:18px">
    NEW QUOTE REQUEST · STRIKE PRINT
  </div>
  <div style="padding:18px;border:1px solid #e5e7eb;border-top:none">
    <table cellpadding="6" style="border-collapse:collapse;font-size:13px;margin-bottom:14px">
      <tr><td style="color:#475569"><b>Name</b></td><td>${escapeHtml(customer_name)}</td></tr>
      <tr><td style="color:#475569"><b>Phone</b></td><td>${escapeHtml(customer_phone || '(not provided)')}</td></tr>
      <tr><td style="color:#475569"><b>Email</b></td><td>${escapeHtml(customer_email || '(not provided)')}</td></tr>
      <tr><td style="color:#475569"><b>Total (inc GST)</b></td><td><b>${escapeHtml(quote_total)}</b></td></tr>
    </table>
    ${customer_message ? `
    <div style="margin:14px 0">
      <div style="font-size:12px;color:#475569;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">Customer notes</div>
      <div style="white-space:pre-wrap;background:#f6f7f8;padding:10px 12px;border-left:3px solid #f0601f">${escapeHtml(customer_message)}</div>
    </div>` : ''}
    <div style="margin:14px 0">
      <div style="font-size:12px;color:#475569;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">Quote breakdown</div>
      <pre style="font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:12px;background:#0f1729;color:#e2e8f0;padding:14px;white-space:pre-wrap;margin:0">${escapeHtml(quote_breakdown)}</pre>
    </div>
    <p style="margin-top:16px;color:#475569;font-size:12px">
      Mockup and original site photo are attached to this email. This is an
      INDICATIVE quote only — final pricing is subject to site inspection.
    </p>
  </div>
</div>`.trim();

  const payload = {
    from:    sender,
    to:      [recipient],
    subject: `Quote request — ${customer_name}${quote_total ? ' — ' + quote_total : ''}`,
    html,
    attachments
  };
  if (customer_email && /^\S+@\S+\.\S+$/.test(customer_email)) {
    payload.reply_to = customer_email;
  }

  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Resend error', r.status, text);
      return res.status(502).json({ error: `Resend ${r.status}: ${text.slice(0, 280)}` });
    }
    const data = await r.json().catch(() => ({}));
    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error('send-quote handler failed', err);
    return res.status(500).json({ error: err.message || 'Email send failed' });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' }
  }
};
