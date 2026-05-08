// POST /api/admin/logout — clears the session cookie. No body required.
import { buildClearCookie, checkOrigin } from './_lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // CSRF defence: reject cross-origin POSTs even on logout. A third-party
  // page can't usefully log the admin out of their own session, but
  // there's no reason to allow it either.
  if (!checkOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden (cross-origin request rejected)' });
  }
  // buildClearCookie returns BOTH the new __Host- cookie and the legacy
  // name, so admins logged in before the cookie-name change still get
  // cleanly logged out.
  res.setHeader('Set-Cookie', buildClearCookie());
  return res.status(204).end();
}
