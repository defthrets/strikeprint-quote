// GET /api/admin/me — returns { ok: true, username } if the request carries
// a valid session cookie, 401 otherwise. The admin React app polls this on
// mount to decide whether to show the login form or the dashboard, and the
// dashboard reads `username` for the welcome message.
import { readSessionToken, verifySessionToken, ADMIN_USERNAMES } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const token = readSessionToken(req);
  const payload = await verifySessionToken(token);
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ ok: false });
  }
  // Legacy tokens minted before per-user JWTs shipped won't have `sub`;
  // surface them as 'admin' so the UI can still render something.
  const sub = (payload.sub || '').toString().toLowerCase();
  const username = ADMIN_USERNAMES.includes(sub) ? sub : 'admin';
  return res.status(200).json({ ok: true, username });
}
