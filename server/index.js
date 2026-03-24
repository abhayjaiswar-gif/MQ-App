const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const morgan = require('morgan');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/login', async (req, res) => {
  console.log('\n--- LOGIN REQUEST ---');
  console.log('BODY:', req.body);

  const { email, password } = req.body;

  // ✅ Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }

  try {
    const formattedEmail = email.toLowerCase().trim();

    const [rows] = await db.query(
      'SELECT id, email, password, is_active, hash_key FROM users WHERE email = ?',
      [formattedEmail]
    );

    // ❌ User not found
    if (rows.length === 0) {
      console.log('❌ USER NOT FOUND');
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password!'
      });
    }

    const user = rows[0];
    console.log('✅ USER FOUND:', user.email);

    // ❌ Inactive
    if (user.is_active !== 1) {
      console.log('❌ USER INACTIVE');
      return res.status(403).json({
        success: false,
        message: 'Account inactive'
      });
    }

    const cleanPassword = password.trim();
    let isMatch = false;

    // 🔍 Detect hash type
    const isSHA1 = user.password.length === 40;
    const isBcrypt = user.password.startsWith('$2');

    console.log('🔍 HASH TYPE:', isSHA1 ? 'SHA1' : isBcrypt ? 'BCRYPT' : 'UNKNOWN');

    // =========================
    // 🔐 SHA1 LOGIN (OLD USERS)
    // =========================
    if (isSHA1) {
      const sha1 = crypto
        .createHash('sha1')
        .update(cleanPassword)
        .digest('hex');

      console.log('➡️ ENTERED SHA1:', sha1);
      console.log('➡️ DB SHA1     :', user.password);

      if (sha1 === user.password) {
        isMatch = true;

        console.log('✅ SHA1 MATCH');

        // 🔥 Upgrade to bcrypt
        const hashed = await bcrypt.hash(cleanPassword, 10);
        await db.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashed, user.id]
        );

        console.log('🔄 Password upgraded to bcrypt');
      } else {
        console.log('❌ SHA1 MISMATCH');
      }
    }

    // =========================
    // 🔐 BCRYPT LOGIN (NEW USERS)
    // =========================
    else if (isBcrypt) {
      isMatch = await bcrypt.compare(cleanPassword, user.password);

      console.log('➡️ BCRYPT MATCH:', isMatch);
    }

    // =========================
    // ❌ UNKNOWN FORMAT
    // =========================
    else {
      console.log('⚠️ UNKNOWN PASSWORD FORMAT');
    }

    // ❌ Wrong password
    if (!isMatch) {
      console.log('❌ LOGIN FAILED');
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password!'
      });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '8h' }
    );

    console.log('🎉 LOGIN SUCCESS');

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        hash_key: user.hash_key
      }
    });

  } catch (err) {
    console.error('❌ ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// 📝 REGISTER API
app.post('/api/register', async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  try {
    const formattedEmail = email.toLowerCase().trim();
    const fullName = `${firstname} ${lastname}`.trim();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const addedDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS

    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [formattedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Insert new user
    // Using defaults for other columns as per the provided table structure
    const [result] = await db.query(
      `INSERT INTO users (
        email, password, name, is_active, 
        is_super_admin, role_id, added_date, 
        mobile, address_line1, address_line2, 
        city, state, pincode, remarks, profile_pic,
        app_access, web_access, added_by, added_ip
      ) VALUES (?, ?, ?, 1, 0, 2, ?, '', '', '', '', '', '', '', '', 1, 1, 0, '127.0.0.1')`,
      [formattedEmail, hashedPassword, fullName, addedDate]
    );

    console.log('🎉 REGISTRATION SUCCESS:', formattedEmail);

    return res.json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    });

  } catch (err) {
    console.error('❌ REGISTRATION ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: err.message
    });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});