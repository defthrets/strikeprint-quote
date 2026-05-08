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
// JWT secret: STRIKEPRINT_AUTH_SECRET — must be ≥32 chars (256 bits)
//   for HS256. Generate one with:  openssl rand -base64 32
// Per-user password hashes: STRIKEPRINT_ADMIN_HASH_<USERNAME_UPPERCASE>
// e.g. STRIKEPRINT_ADMIN_HASH_MICK, STRIKEPRINT_ADMIN_HASH_KELVIN, etc.
//
// Backwards-compat: if no per-user hash is set, the legacy
// STRIKEPRINT_ADMIN_PASSWORD_HASH env var is accepted for any username
// in ADMIN_USERNAMES (so the existing single-admin install keeps
// working until per-user hashes are deployed). Logs a warning when used
// — once all 4 per-user hashes are deployed, remove the legacy env var
// from Vercel so a single shared password isn't a back door.
//
// ─── Security model ─────────────────────────────────────────────
// Defences in place:
//   - Constant-time verifyCredentials (dummy bcrypt run on invalid
//     usernames) — blocks timing-based username enumeration
//   - Per-username lockout (5 failures → 15min lock) — blocks slow
//     credential stuffing on a known username
//   - Per-IP rate limit on login (login.js, 8 attempts / 60s)
//   - Origin/Referer check on mutating methods — blocks CSRF
//   - HttpOnly + Secure + SameSite=Lax cookies + __Host- prefix
//   - HS256 JWT with ≥256-bit secret, 12h expiry
//   - bcrypt cost 10 password hashes
// Threats not addressed (low risk for 4-admin workshop tool):
//   - Persistent rate limiting across function cold starts
//   - 2FA / account recovery
//   - Stolen-token revocation (12h expiry mitigates)

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// __Host- prefix locks the cookie to: this exact host, Path=/, Secure,
// no Domain attribute. Browsers refuse cookies missing any of those —
// extra hardening against subdomain hijack + cookie injection.
const COOKIE_NAME = '__Host-strikeprint_admin';
// Older deploys used this name. We still read it at session-check time
// so admins logged in before this change don't get bumped on deploy —
// the next login will mint a __Host- cookie and the old one ages out.
const LEGACY_COOKIE_NAME = 'strikeprint_admin';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

// Lowercase canonical identifiers — display capitalisation happens in UI.
export const ADMIN_USERNAMES = ['mick', 'kelvin', 'paul', 'andrew'];

// Pre-computed bcrypt hash used as a stand-in when verifying against an
// unknown username. Keeps the auth code path constant-time regardless
// of whether the username exists — without this, an attacker can time
// /api/admin/login responses and learn which usernames are real (the
// real ones run bcrypt; unknown ones return immediately, ~100ms apart).
//
// This is a hash of an arbitrary string admins will never use; even if
// someone happened to send that string, they'd still fail because we
// gate on `username && hash && ok` (see verifyCredentials below).
const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const MIN_SECRET_LEN = 32;
const secretBytes = () => {
  const secret = process.env.STRIKEPRINT_AUTH_SECRET;
  if (!secret || secret.length < MIN_SECRET_LEN) {
    throw new Error(
      `STRIKEPRINT_AUTH_SECRET env var missing or too short ` +
      `(need ≥${MIN_SECRET_LEN} chars; generate with: openssl rand -base64 32)`
    );
  }
  return new TextEncoder().encode(secret);
};

// Returns a normalised username (lowercase, valid) or null.
function normaliseUsername(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const u = raw.trim().toLowerCase();
  return ADMIN_USERNAMES.includes(u) ? u : null;
}

// Whether the legacy fallback hash is currently being used. Logged
// once at startup so deployments using only the shared hash get a
// nudge to set up per-user ones.
let legacyHashWarned = false;
function passwordHashFor(username) {
  const envKey = `STRIKEPRINT_ADMIN_HASH_${username.toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey];
  if (process.env.STRIKEPRINT_ADMIN_PASSWORD_HASH) {
    if (!legacyHashWarned) {
      legacyHashWarned = true;
      console.warn(
        `[auth] STRIKEPRINT_ADMIN_HASH_${username.toUpperCase()} not set — ` +
        `falling back to shared STRIKEPRINT_ADMIN_PASSWORD_HASH. ` +
        `Generate per-user hashes with scripts/admin-password.js and remove the shared env var.`
      );
    }
    return process.env.STRIKEPRINT_ADMIN_PASSWORD_HASH;
  }
  return null;
}

// ─── Per-username lockout ───────────────────────────────────────
// Track failed login attempts per username; lock the account for
// LOCKOUT_DURATION after LOCKOUT_THRESHOLD failures. Resets on a
// successful login. Per-username (not per-IP) so an attacker can't
// rotate IPs to keep going against the same account, but ALSO can't
// lock everyone else out by guessing wrong (we only track real
// usernames — see recordFailure).
//
// In-memory Map: resets on serverless cold starts. That's fine —
// 4 admins with the right passwords don't notice cold-start resets,
// and an attacker still has to push past the per-IP limiter on every
// invocation. Persistent storage (Vercel KV) would be the upgrade
// path if traffic ever grows.
const failedAttempts = new Map(); // username → { count, lockedUntil }
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// If the username is locked, returns the unlock timestamp (ms).
// Otherwise returns null. Cleans up expired entries on the way.
export function checkLockout(rawUsername) {
  const username = normaliseUsername(rawUsername);
  if (!username) return null;
  const entry = failedAttempts.get(username);
  if (!entry || !entry.lockedUntil) return null;
  if (entry.lockedUntil > Date.now()) return entry.lockedUntil;
  // Expired — drop it
  failedAttempts.delete(username);
  return null;
}

export function recordFailure(rawUsername) {
  // ONLY track real usernames so an attacker can't fill the map with
  // garbage to DoS legitimate admins (or use lockouts to enumerate
  // valid usernames by observing 429 responses).
  const username = normaliseUsername(rawUsername);
  if (!username) return;
  const entry = failedAttempts.get(username) || { count: 0 };
  entry.count += 1;
  if (entry.count >= LOCKOUT_THRESHOLD) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  failedAttempts.set(username, entry);
}

export function clearFailures(rawUsername) {
  const username = normaliseUsername(rawUsername);
  if (username) failedAttempts.delete(username);
}

// Verify a username + password pair. Returns the canonical username on
// success, or null on failure.
//
// Constant-time guarantee: we ALWAYS run bcrypt.compare against either
// the real hash or DUMMY_HASH, never short-circuit on missing user /
// missing hash. bcrypt.compare itself is constant-time relative to
// hash length, so the total wall-clock time for any (username, password)
// pair is dominated by one bcrypt round — attackers can't infer
// "username doesn't exist" from response timing.
export async function verifyCredentials(rawUsername, plainPassword) {
  const username = normaliseUsername(rawUsername);
  const hash = username ? passwordHashFor(username) : null;
  // Always run bcrypt.compare. If we have no real hash, compare against
  // the dummy so the timing matches a failing real-user compare.
  let bcryptOk = false;
  try {
    bcryptOk = await bcrypt.compare(
      typeof plainPassword === 'string' ? plainPassword : '',
      hash || DUMMY_HASH
    );
  } catch {
    bcryptOk = false;
  }
  // Triple-gate: only succeed if username was valid AND we had a real
  // hash AND the compare matched. Catches the (impossible-but-defensive)
  // case of someone hitting the dummy with a colliding password.
  return (username && hash && bcryptOk) ? username : null;
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
// HttpOnly + Secure + SameSite=Lax + __Host- prefix means:
//   - JS can't read it (HttpOnly)
//   - Only sent over HTTPS (Secure)
//   - Not sent on cross-site POST/DELETE — basic CSRF protection (Lax)
//   - Browser refuses to set it without Path=/, Secure, no Domain (__Host-)
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
  // Two cookies: clear the new __Host- one + the legacy name (in case
  // an old session is still floating around). Browsers only set/clear
  // the cookie that matches all the attributes; including both is
  // belt-and-braces.
  const fresh = `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  const legacy = `${LEGACY_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  return [fresh, legacy];
}

// Pull the session cookie off an incoming request. Vercel's req.cookies is
// pre-parsed when bodyParser is on; fall back to manual parse otherwise.
// Reads both the new __Host-prefixed name AND the legacy name so admins
// who logged in before this deploy don't get bumped — their next login
// gets the new cookie name automatically.
export function readSessionToken(req) {
  if (req.cookies) {
    if (req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
    if (req.cookies[LEGACY_COOKIE_NAME]) return req.cookies[LEGACY_COOKIE_NAME];
  }
  const raw = req.headers?.cookie || '';
  for (const name of [COOKIE_NAME, LEGACY_COOKIE_NAME]) {
    // Escape regex special chars in the cookie name (the __Host- prefix
    // contains - which is a regex literal but we still want to be safe).
    const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = raw.match(new RegExp('(?:^|; )' + safe + '=([^;]+)'));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

// Verify the request originated from our own site, not a third-party
// page tricking the browser into POSTing with the admin's cookie. Browsers
// always send Origin on POST/PATCH/DELETE; some send Referer on GET.
// We accept either as long as it matches `host`. Returns true if origin
// looks legit, false to reject.
export function checkOrigin(req) {
  const host = (req.headers.host || '').toLowerCase();
  if (!host) return false;

  const origin = req.headers.origin;
  if (origin) {
    try {
      const u = new URL(origin);
      return u.host.toLowerCase() === host;
    } catch { return false; }
  }
  // No Origin header: fall back to Referer. Only set on browser
  // navigations — non-browser tools (curl with no flags) won't have it,
  // which is the rejection we want.
  const referer = req.headers.referer;
  if (referer) {
    try {
      const u = new URL(referer);
      return u.host.toLowerCase() === host;
    } catch { return false; }
  }
  return false;
}

// Returns the canonical username (e.g. 'mick') on success — handlers
// pass this to applyMutation so the audit log records who did it.
// Returns false on auth failure (and writes the 401 / 403 response).
//
// On state-changing methods (POST, PATCH, DELETE, PUT) we ALSO require
// a same-origin Origin/Referer header — that's the CSRF defence. A
// third-party page submitting a form to /api/admin/* with the admin's
// cookie attached gets rejected here even before auth runs.
const MUTATING = new Set(['POST', 'PATCH', 'DELETE', 'PUT']);
export async function requireAdmin(req, res) {
  if (MUTATING.has(req.method) && !checkOrigin(req)) {
    res.status(403).json({ error: 'Forbidden (cross-origin request rejected)' });
    return false;
  }
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
