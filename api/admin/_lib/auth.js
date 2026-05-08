// Shared auth helpers for admin endpoints.
//
// We use:
//   - bcryptjs to verify the password against a hash stored in env (the hash
//     is generated once via `node scripts/admin-password.js <pwd>` and
//     pasted into Vercel as STRIKEPRINT_ADMIN_PASSWORD_HASH).
//   - jose to mint and verify a short-lived JWT cookie. JWT secret comes
//     from STRIKEPRINT_AUTH_SECRET (any random ≥32-char string).
//
// No database required — auth is fully stateless via cookies. Single-admin
// design; no user table.
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'strikeprint_admin';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

const secretBytes = () => {
  const secret = process.env.STRIKEPRINT_AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('STRIKEPRINT_AUTH_SECRET env var missing or too short (need 16+ chars)');
  }
  return new TextEncoder().encode(secret);
};

export async function verifyPassword(plain) {
  const hash = process.env.STRIKEPRINT_ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function signSessionToken() {
  return await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE_SECONDS}s`)
    .sign(secretBytes());
}

export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretBytes());
    return payload;
  } catch {
    return null;
  }
}

// Build a Set-Cookie header that the browser stores for COOKIE_MAX_AGE_SECONDS.
// HttpOnly + Secure + SameSite=Lax prevents JS access and CSRF basics.
export function buildSessionCookie(token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`
  ];
  return parts.join('; ');
}

export function buildClearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Pull the session cookie off an incoming request. Vercel's req.cookies is
// pre-parsed when bodyParser is on; fall back to manual parse otherwise.
export function readSessionToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const raw = req.headers?.cookie || '';
  const m = raw.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function requireAdmin(req, res) {
  const token = readSessionToken(req);
  const payload = await verifySessionToken(token);
  if (!payload || payload.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
