#!/usr/bin/env node
// Generate a bcrypt hash for the admin password.
// Usage:  node scripts/admin-password.js <password>
// Paste the printed hash into Vercel as STRIKEPRINT_ADMIN_PASSWORD_HASH.
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: node scripts/admin-password.js <password>');
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('');
console.log('  Strike Print admin password hash');
console.log('  --------------------------------');
console.log('');
console.log('  Add to Vercel → Project → Settings → Environment Variables:');
console.log('');
console.log('  STRIKEPRINT_ADMIN_PASSWORD_HASH=' + hash);
console.log('');
console.log('  Also set (any random ≥32-char string):');
console.log('  STRIKEPRINT_AUTH_SECRET=<paste 32+ random characters>');
console.log('');
