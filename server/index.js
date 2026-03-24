const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📁 MULTER CONFIGURATION
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const schoolUploadFields = upload.fields([
  { name: 'school_logo', maxCount: 1 },
  { name: 'time_table_image', maxCount: 1 },
  { name: 'principal_signature_image', maxCount: 1 },
  { name: 'head_coach_signature_image', maxCount: 1 }
]);

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
      { id: user.id, email: user.email, role_id: user.role_id },
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
        hash_key: user.hash_key,
        role_id: user.role_id
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
      userId: result.insertId,
      role_id: 2
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

// 🏫 GET SCHOOLS API
app.get('/api/schools', async (req, res) => {
  try {
    // Return all columns joined with users to get OM name and subquery for student count
    const [rows] = await db.query(`
      SELECT s.*, u.name as om_name,
      (SELECT COUNT(*) FROM students src WHERE src.school_id = s.id) as student_count
      FROM schools s 
      LEFT JOIN users u ON s.mq_om_id = u.id
    `);
    res.json({ success: true, schools: rows });
  } catch (err) {
    console.error('FETCH SCHOOLS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching schools' });
  }
});

// 🏫 GET SINGLE SCHOOL DETAIL
app.get('/api/schools/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM schools WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    res.json({ success: true, school: rows[0] });
  } catch (err) {
    console.error('FETCH SCHOOL DETAIL ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching school details' });
  }
});

// 🏫 ADD NEW SCHOOL API
app.post('/api/schools', schoolUploadFields, async (req, res) => {
  const data = req.body;
  const files = req.files;

  try {
    // Extract file names if uploaded
    if (files['school_logo']) data.school_logo = files['school_logo'][0].filename;
    if (files['time_table_image']) data.time_table_image = files['time_table_image'][0].filename;
    if (files['principal_signature_image']) data.principal_signature_image = files['principal_signature_image'][0].filename;
    if (files['head_coach_signature_image']) data.head_coach_signature_image = files['head_coach_signature_image'][0].filename;

    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const columns = fields.join(', ');
    const values = fields.map(field => data[field]);

    const [result] = await db.query(
      `INSERT INTO schools (${columns}, last_updated_on) VALUES (${placeholders}, NOW())`,
      values
    );

    res.json({ success: true, message: 'School added successfully', id: result.insertId });
  } catch (err) {
    console.error('ADD SCHOOL ERROR:', err);
    res.status(500).json({ success: false, message: 'Error adding school', error: err.message });
  }
});

// 🏫 UPDATE SCHOOL API
app.put('/api/schools/:id', schoolUploadFields, async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const files = req.files;
  
  try {
    // Extract file names if uploaded
    if (files['school_logo']) data.school_logo = files['school_logo'][0].filename;
    if (files['time_table_image']) data.time_table_image = files['time_table_image'][0].filename;
    if (files['principal_signature_image']) data.principal_signature_image = files['principal_signature_image'][0].filename;
    if (files['head_coach_signature_image']) data.head_coach_signature_image = files['head_coach_signature_image'][0].filename;

    // Dynamically build update query
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'last_updated_on');
    if (fields.length === 0 && !files) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => data[field]);
    values.push(new Date().toISOString().slice(0, 19).replace('T', ' ')); // last_updated_on
    values.push(id);

    await db.query(`UPDATE schools SET ${setClause}, last_updated_on = ? WHERE id = ?`, values);
    
    res.json({ success: true, message: 'School updated successfully' });
  } catch (err) {
    console.error('UPDATE SCHOOL ERROR:', err);
    res.status(500).json({ success: false, message: 'Error updating school' });
  }
});

// 📅 GET AVAILABLE MONTHS
app.post('/api/available-months', async (req, res) => {
  // Mocking the structure from PHP
  const months = {
    1: 'January', 2: 'February', 3: 'March', 4: 'April', 
    5: 'May', 6: 'June', 7: 'July', 8: 'August', 
    9: 'September', 10: 'October', 11: 'November', 12: 'December'
  };
  // Logic could be more complex (filter by what's in DB for that school/year)
  res.json({ success: true, months });
});

// 🛠️ EQUIPMENT SEARCH (Autocomplete)
app.get('/api/equipment', async (req, res) => {
  const term = req.query.term || '';
  try {
    // Assuming a table 'equipments' or similar exists, or query from stock list
    // For now, let's search in a generic items table or stock
    const [rows] = await db.query(
      'SELECT DISTINCT sku_name as value, id FROM stock_requests WHERE sku_name LIKE ? LIMIT 10',
      [`%${term}%`]
    );
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

// 📊 GET ALL EQUIPMENTS FOR SCHOOL
app.post('/api/school-equipments', async (req, res) => {
  const { school_id, year } = req.body;
  try {
    // This query would ideally fetch unique items and their stock entries
    // Mocking the data structure expected by the PHP JS
    const [items] = await db.query(
      'SELECT DISTINCT item_id as id, sku_name as value FROM school_stock WHERE school_id = ?',
      [school_id]
    );

    for (let item of items) {
      const [stock] = await db.query(
        'SELECT * FROM school_stock WHERE school_id = ? AND item_id = ?',
        [school_id, item.id]
      );
      item.stock = stock;
    }

    res.json(items);
  } catch (err) {
    res.json([]);
  }
});

// 💾 AUTOSAVE STOCK
app.post('/api/autosave-stock', async (req, res) => {
  const { school_id, equipment_id, month_no, field, value } = req.body;
  try {
    // Try to find if record exists
    const [existing] = await db.query(
      'SELECT id FROM school_stock WHERE school_id = ? AND item_id = ? AND month_no = ?',
      [school_id, equipment_id, month_no]
    );

    if (existing.length > 0) {
      // Update
      await db.query(
        `UPDATE school_stock SET ${field} = ? WHERE id = ?`,
        [value, existing[0].id]
      );
    } else {
      // Insert
      await db.query(
        `INSERT INTO school_stock (school_id, item_id, month_no, ${field}) VALUES (?, ?, ?, ?)`,
        [school_id, equipment_id, month_no, value]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('AUTOSAVE ERROR:', err);
    res.json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});