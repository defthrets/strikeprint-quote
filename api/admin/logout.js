// POST /api/admin/logout — clears the session cookie. No body required.
import { buildClearCookie } from './_lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Set-Cookie', buildClearCookie());
  return res.status(204).end();
}
