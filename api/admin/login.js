// POST /api/admin/login — { password } → 204 + Set-Cookie session token
// Rate-limited per-IP via in-memory counter (best-effort; serverless cold
// starts reset it, which is fine for a single-admin endpoint).
import { verifyPassword, signSessionToken, buildSessionCookie } from './_lib/auth.js';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_ATTEMPTS = 8;
const attempts = new Map(); // ip -> { count, resetAt }

function rateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX_ATTEMPTS;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
          || req.socket?.remoteAddress
          || 'unknown';

  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const password = (body.password || '').toString();

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const ok = await verifyPassword(password);
  if (!ok) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  const token = await signSessionToken();
  res.setHeader('Set-Cookie', buildSessionCookie(token));
  return res.status(204).end();
}

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
