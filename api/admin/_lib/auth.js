// Shared auth helpers for admin endpoints.
//
// Multi-admin: 4 named editors (Mick, Kelvin, Paul, Andrew). Each has
// their own bcrypt password hash stored in a per-user env var. The list
// of usernames is defined here so adding a new admin = (1) add their
// username to ADMIN_USERNAMES, (2) generate a hash via
// `node scripts/admin-password.js <password>`, (3) paste it as the
// matching env var below, and (4) push.
//
// We use:
//   - bcryptjs to verify the password against the per-user hash
//   - jose to mint + verify a JWT cookie that carries the username
//
// JWT secret: STRIKEPRINT_AUTH_SECRET (any random ≥16-char string).
// Per-user password hashes: STRIKEPRINT_ADMIN_HASH_<USERNAME_UPPERCASE>
// e.g. STRIKEPRINT_ADMIN_HASH_MICK, STRIKEPRINT_ADMIN_HASH_KELVIN, etc.
//
// Backwards-compat: if no per-user hash is set, the legacy
// STRIKEPRINT_ADMIN_PASSWORD_HASH env var is accepted for any username
// in ADMIN_USERNAMES (so the existing single-admin install keeps
// working until per-user hashes are deployed).
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'strikeprint_admin';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

// Lowercase canonical identifiers — display capitalisation happens in UI.
export const ADMIN_USERNAMES = ['mick', 'kelvin', 'paul', 'andrew'];

const secretBytes = () => {
  const secret = process.env.STRIKEPRINT_AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('STRIKEPRINT_AUTH_SECRET env var missing or too short (need 16+ chars)');
  }
  return new TextEncoder().encode(secret);
};

// Returns a normalised username (lowercase, valid) or null.
function normaliseUsername(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const u = raw.trim().toLowerCase();
  return ADMIN_USERNAMES.includes(u) ? u : null;
}

// Look up the password hash for a given username. Falls back to the
// legacy single-admin hash so the existing deployment doesn't break
// the moment this code lands — admins can roll out per-user hashes
// at their own pace.
function passwordHashFor(username) {
  const envKey = `STRIKEPRINT_ADMIN_HASH_${username.toUpperCase()}`;
  return process.env[envKey] || process.env.STRIKEPRINT_ADMIN_PASSWORD_HASH || null;
}

// Verify a username + password pair. Returns the canonical username on
// success, or null on failure. Uses bcrypt's constant-time compare.
export async function verifyCredentials(rawUsername, plainPassword) {
  const username = normaliseUsername(rawUsername);
  if (!username) return null;
  if (!plainPassword || typeof plainPassword !== 'string') return null;
  const hash = passwordHashFor(username);
  if (!hash) return null;
  try {
    const ok = await bcrypt.compare(plainPassword, hash);
    return ok ? username : null;
  } catch {
    return null;
  }
}

// Backwards-compat shim. Old code paths that just want to verify a
// password without a username can still call this — it tries the
// password against every configured hash. Used by tests / migration
// scripts; production handlers should use verifyCredentials.
export async function verifyPassword(plain) {
  if (!plain) return false;
  for (const username of ADMIN_USERNAMES) {
    const result = await verifyCredentials(username, plain);
    if (result) return true;
  }
  return false;
}

export async function signSessionToken(username) {
  return await new SignJWT({ role: 'admin', sub: username })
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

// Returns the canonical username (e.g. 'mick') on success — handlers
// pass this to applyMutation so the audit log records who did it.
// Returns false on auth failure (and writes the 401 response).
export async function requireAdmin(req, res) {
  const token = readSessionToken(req);
  const payload = await verifySessionToken(token);
  if (!payload || payload.role !== 'admin') {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  // sub may be missing on legacy tokens minted before per-user JWTs
  // shipped — treat them as "unknown" rather than rejecting outright,
  // so existing sessions don't get bumped on deploy.
  const username = normaliseUsername(payload.sub) || 'admin';
  return username;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
