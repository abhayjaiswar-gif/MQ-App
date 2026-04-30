/**
 * fix_coach_password.js
 * Inspects the current password hash for coach@mq.com and re-hashes it with bcrypt.
 * Run: node fix_coach_password.js
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db');

const TARGET_EMAIL = 'coach@mq.com';
const PLAIN_PASSWORD = 'mq12345';

async function fixPassword() {
  try {
    // 1. Fetch the current stored hash
    const [rows] = await db.query(
      'SELECT id, email, password, is_active FROM users WHERE email = ?',
      [TARGET_EMAIL]
    );

    if (rows.length === 0) {
      console.log('❌ User not found:', TARGET_EMAIL);
      process.exit(1);
    }

    const user = rows[0];
    console.log('✅ User found:', user.email, '| is_active:', user.is_active);
    console.log('🔑 Current password value:', user.password);
    console.log('📏 Password length:', user.password.length);

    const isSHA1   = user.password.length === 40 && /^[a-f0-9]+$/i.test(user.password);
    const isMD5    = user.password.length === 32 && /^[a-f0-9]+$/i.test(user.password);
    const isBcrypt = user.password.startsWith('$2');
    const isPlain  = !isSHA1 && !isMD5 && !isBcrypt;

    console.log('🔍 Detected format:', isSHA1 ? 'SHA1' : isMD5 ? 'MD5' : isBcrypt ? 'BCRYPT' : 'PLAIN/UNKNOWN');

    // 2. Verify against known password
    let matches = false;

    if (isBcrypt) {
      matches = await bcrypt.compare(PLAIN_PASSWORD, user.password);
      console.log('➡️  Bcrypt compare result:', matches);
    } else if (isSHA1) {
      const sha1 = crypto.createHash('sha1').update(PLAIN_PASSWORD).digest('hex');
      matches = sha1 === user.password;
      console.log('➡️  SHA1 hash of input :', sha1);
      console.log('➡️  SHA1 in DB         :', user.password);
      console.log('➡️  SHA1 match         :', matches);
    } else if (isMD5) {
      const md5 = crypto.createHash('md5').update(PLAIN_PASSWORD).digest('hex');
      matches = md5 === user.password;
      console.log('➡️  MD5 hash of input  :', md5);
      console.log('➡️  MD5 in DB          :', user.password);
      console.log('➡️  MD5 match          :', matches);
    } else {
      // Plain text comparison
      matches = user.password === PLAIN_PASSWORD;
      console.log('➡️  Plain text match   :', matches);
    }

    // 3. If it matches with known password, upgrade to bcrypt
    if (matches) {
      const newHash = await bcrypt.hash(PLAIN_PASSWORD, 10);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
      console.log('✅ Password re-hashed to bcrypt successfully!');
      console.log('🔑 New hash:', newHash);
    } else {
      console.log('⚠️  Password does NOT match "mq12345".');
      console.log('');
      console.log('👉 Forcing a password reset to "mq12345" with bcrypt...');
      const newHash = await bcrypt.hash(PLAIN_PASSWORD, 10);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
      console.log('✅ Password forcibly set to "mq12345" (bcrypt) for', TARGET_EMAIL);
    }

    // 4. Also ensure user is active
    if (user.is_active !== 1) {
      await db.query('UPDATE users SET is_active = 1 WHERE id = ?', [user.id]);
      console.log('✅ User activated (is_active set to 1)');
    }

    console.log('\n🎉 Done! Try logging in again with:');
    console.log('   Email   :', TARGET_EMAIL);
    console.log('   Password:', PLAIN_PASSWORD);

  } catch (err) {
    console.error('❌ ERROR:', err.message);
  } finally {
    process.exit(0);
  }
}

fixPassword();
