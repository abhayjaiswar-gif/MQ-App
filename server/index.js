const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const crypto = require('crypto');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MQ-App Backend API' });
});

// DB Test
app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.json({
      success: true,
      message: 'Database connection is successful!',
      data: rows
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// ✅ FIXED LOGIN API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please enter your email and password'
    });
  }

  try {
    const formattedEmail = email.toLowerCase().trim();

    const [rows] = await db.query(
      'SELECT id, email, password, hash_key, is_active FROM users WHERE email = ?',
      [formattedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password!'
      });
    }

    const user = rows[0];

    // Generate hashes
    const md5Hash = crypto.createHash('md5').update(password).digest('hex');
    const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');

    let isMatch = false;

    // ✅ bcrypt check (only if it's bcrypt hash)
    if (user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    }

    // ✅ Legacy support
    if (!isMatch) {
      isMatch =
        password === user.password ||
        md5Hash === user.password ||
        sha1Hash === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password!'
      });
    }

    // Check active status
    if (user.is_active !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Your account is locked/inactive. Contact Administrator.'
      });
    }

    // ✅ Upgrade old password to bcrypt
    if (
      user.password === password ||
      user.password === md5Hash ||
      user.password === sha1Hash
    ) {
      const newHash = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [
        newHash,
        user.id
      ]);
      console.log('Password upgraded to bcrypt for user:', user.email);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'appsecret123',
      { expiresIn: '8h' }
    );

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

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// Sample API
app.get('/api/requests', (req, res) => {
  const sampleRequests = [
    {
      id: 'REQ-1023',
      item: 'Laptop, Model X1',
      quantity: 5,
      date: 'Oct 25, 2023',
      status: 'Pending Verification'
    },
    {
      id: 'REQ-1022',
      item: 'Monitor, 27-inch',
      quantity: 10,
      date: 'Oct 20, 2023',
      status: 'Processing'
    }
  ];

  res.json({ success: true, data: sampleRequests });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});