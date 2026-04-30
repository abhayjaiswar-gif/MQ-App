/**
 * fix_all_passwords.js
 * Scans all active users and upgrades any plain-text passwords to bcrypt.
 * Run: node fix_all_passwords.js
 */
const bcrypt = require('bcrypt');
const db = require('./db');

(async () => {
  try {
    const [rows] = await db.query('SELECT id, email, password FROM users WHERE is_active = 1');
    console.log(`🔍 Scanning ${rows.length} active users...\n`);

    let fixed = 0;
    let skipped = 0;

    for (const u of rows) {
      const pwd = u.password || '';
      const isBcrypt = pwd.startsWith('$2');
      const isSHA1   = pwd.length === 40 && /^[a-f0-9]+$/i.test(pwd);
      const isMD5    = pwd.length === 32 && /^[a-f0-9]+$/i.test(pwd);
      const isPlain  = !isBcrypt && !isSHA1 && !isMD5;

      if (isPlain) {
        console.log(`🔧 Plain-text detected → ${u.email} | value: "${pwd}"`);
        const hash = await bcrypt.hash(pwd, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, u.id]);
        console.log(`   ✅ Re-hashed successfully\n`);
        fixed++;
      } else {
        skipped++;
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`   Fixed  : ${fixed} user(s)`);
    console.log(`   Skipped: ${skipped} user(s) (already hashed)`);
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    process.exit(0);
  }
})();
