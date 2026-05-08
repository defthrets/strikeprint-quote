#!/usr/bin/env node
// Generate a bcrypt hash for an admin password.
//
// Usage:
//   node scripts/admin-password.js <username> <password>
//   node scripts/admin-password.js <password>            (legacy single-admin)
//
// The 4 named admins are: mick, kelvin, paul, andrew.
// Output prints the env var to add to Vercel for that user.
import bcrypt from 'bcryptjs';

const ADMIN_USERNAMES = ['mick', 'kelvin', 'paul', 'andrew'];

let username = null;
let password = null;

if (process.argv.length === 3) {
  // Legacy single-arg: just a password — falls back to the shared
  // STRIKEPRINT_ADMIN_PASSWORD_HASH env var (still supported by auth.js).
  password = process.argv[2];
} else if (process.argv.length === 4) {
  username = (process.argv[2] || '').toLowerCase();
  password = process.argv[3];
  if (!ADMIN_USERNAMES.includes(username)) {
    console.error(`Unknown username "${username}".`);
    console.error(`Valid names: ${ADMIN_USERNAMES.join(', ')}`);
    console.error(`Add a new one in api/admin/_lib/auth.js and src/Admin.jsx (ADMIN_USERNAMES) before generating its hash.`);
    process.exit(1);
  }
} else {
  console.error('Usage:');
  console.error('  node scripts/admin-password.js <username> <password>');
  console.error('  node scripts/admin-password.js <password>            (shared/legacy)');
  console.error('');
  console.error(`Valid usernames: ${ADMIN_USERNAMES.join(', ')}`);
  process.exit(1);
}

if (!password || password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const envName = username
  ? `STRIKEPRINT_ADMIN_HASH_${username.toUpperCase()}`
  : 'STRIKEPRINT_ADMIN_PASSWORD_HASH';

console.log('');
console.log('  Strike Print admin password hash');
console.log('  --------------------------------');
console.log('');
if (username) {
  console.log(`  Username: ${username}`);
}
console.log('');
console.log('  Add to Vercel → Project → Settings → Environment Variables');
console.log('  (set for Production, Preview, AND Development):');
console.log('');
console.log(`  ${envName}=${hash}`);
console.log('');
console.log('  Also set (one-time, shared across all admins):');
console.log('  STRIKEPRINT_AUTH_SECRET=<paste 32+ random characters>');
console.log('');
console.log('  After adding the env var, redeploy from Vercel for it to take effect.');
console.log('');
