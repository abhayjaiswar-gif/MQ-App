require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db');

async function createSSGM() {
  const email    = 'ssgm2@gmail.com'; // In case ssgm@gmail.com is corrupted, let's create a fresh one just to be safe, or just check ssgm@gmail.com
  const password = 'SSGM@123#';
  const name     = 'SSGM Test User';
  const role_id  = 3; // SSGM role ID

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log(`⚠️ User already exists: ${email} (id=${existing[0].id})`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashKey = crypto.randomBytes(20).toString('hex');
    const addedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await db.query(
      `INSERT INTO users (
        email, password, name, is_active,
        is_super_admin, role_id, added_date,
        mobile, address_line1, address_line2,
        city, state, pincode, remarks, profile_pic,
        app_access, web_access, added_by, added_ip, hash_key
      ) VALUES (?, ?, ?, 1, 0, ?, ?, '', '', '', '', '', '', '', '', 1, 1, 0, '127.0.0.1', ?)`,
      [email, hashedPassword, name, role_id, addedDate, hashKey]
    );

    console.log(`✅ SSGM User created successfully!`);
    console.log(`   ID      : ${result.insertId}`);
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
  } catch (err) {
    console.error('❌ Error creating user:', err.message);
  } finally {
    process.exit(0);
  }
}

createSSGM();
