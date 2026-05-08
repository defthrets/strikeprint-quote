// POST /api/admin/login — { username, password } → 204 + Set-Cookie session
// Rate-limited per-IP via in-memory counter (best-effort; serverless cold
// starts reset it, which is fine for low-traffic admin endpoints).
import { verifyCredentials, signSessionToken, buildSessionCookie } from './_lib/auth.js';

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
  const username = (body.username || '').toString();
  const password = (body.password || '').toString();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Single error message for "user doesn't exist" vs "wrong password" so a
  // brute-forcer can't enumerate the valid usernames.
  const verifiedUsername = await verifyCredentials(username, password);
  if (!verifiedUsername) {
    return res.status(401).json({ error: 'Wrong username or password' });
  }

  const token = await signSessionToken(verifiedUsername);
  res.setHeader('Set-Cookie', buildSessionCookie(token));
  return res.status(200).json({ username: verifiedUsername });
}

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
