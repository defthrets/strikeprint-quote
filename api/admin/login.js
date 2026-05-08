// POST /api/admin/login — { username, password } → 200 + Set-Cookie session
//
// Layered defences:
//   1. Origin/Referer check — reject cross-site POSTs (CSRF)
//   2. Per-IP rate limit — 8 failed attempts / 60s rolls into 429
//   3. Per-username lockout — 5 failures locks account for 15min
//   4. Constant-time bcrypt verify — no username enumeration via timing
//   5. Generic error message — same response for invalid user vs bad password
//
// (1) and (2) are best-effort against script-kiddies — in-memory state
// resets on serverless cold starts. (3) is per-username-in-memory and
// shares the cold-start caveat. For a 4-admin workshop tool this is the
// right balance; for higher-stakes deployments swap in Vercel KV or
// similar persistent store.

import {
  verifyCredentials, signSessionToken, buildSessionCookie,
  checkOrigin, checkLockout, recordFailure, clearFailures
} from './_lib/auth.js';

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

  // CSRF: reject login attempts that didn't come from our own page.
  // Browsers always send Origin on POST. Tools without it (curl with
  // no flags) get 403 — that's fine, real admins use the actual form.
  if (!checkOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden (cross-origin request rejected)' });
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

  // Per-username lockout: if this account is currently locked, return
  // 429 with the unlock time. We do this BEFORE bcrypt so a locked-out
  // attacker can't keep burning CPU on us. The check returns null for
  // unknown usernames (we never lock those — see auth.recordFailure)
  // so this branch doesn't leak which usernames are valid.
  const lockedUntil = checkLockout(username);
  if (lockedUntil) {
    const minutesLeft = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000));
    // Console-log so admin can spot brute-force attempts in Vercel logs
    console.warn(`[login] locked account hit: ip=${ip} username=${username} unlocks in ${minutesLeft}m`);
    return res.status(429).json({
      error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`
    });
  }

  // verifyCredentials runs bcrypt.compare unconditionally (against a
  // dummy hash if the username is unknown) — keeps timing constant so
  // attackers can't enumerate usernames by measuring response speed.
  const verifiedUsername = await verifyCredentials(username, password);

  if (!verifiedUsername) {
    recordFailure(username);
    // Generic message — same for "user doesn't exist" vs "wrong password",
    // so brute-forcers can't figure out which usernames are valid by
    // looking at the error text.
    console.warn(`[login] failed: ip=${ip} username=${username}`);
    return res.status(401).json({ error: 'Wrong username or password' });
  }

  // Success — drop any previous failure tally so legitimate typos don't
  // accumulate over weeks toward a lockout.
  clearFailures(verifiedUsername);
  console.info(`[login] success: ip=${ip} username=${verifiedUsername}`);

  const token = await signSessionToken(verifiedUsername);
  res.setHeader('Set-Cookie', buildSessionCookie(token));
  return res.status(200).json({ username: verifiedUsername });
}

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
