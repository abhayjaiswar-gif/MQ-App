/**
 * seed_user.js - Run once to create a test user
 * Usage: node seed_user.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db');

async function seedUser() {
  const email    = 'maya@gmail.com';
  const password = 'Maya@123#';
  const name     = 'Maya';
  const role_id  = 2; // Standard user role

  try {
    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log(`⚠️  User already exists: ${email} (id=${existing[0].id})`);
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

    console.log(`✅ User created successfully!`);
    console.log(`   ID      : ${result.insertId}`);
    console.log(`   Name    : ${name}`);
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role ID : ${role_id}`);

  } catch (err) {
    console.error('❌ Error creating user:', err.message);
  } finally {
    process.exit(0);
  }
}

seedUser();
