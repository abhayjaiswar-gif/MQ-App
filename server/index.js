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

// 📊 INITIALIZE GRADING SCALES TABLE
const initGradingTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS grading_scales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                min_percent INT NOT NULL,
                max_percent INT NOT NULL,
                descriptor TEXT,
                icon VARCHAR(50),
                color VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        const [rows] = await db.query("SELECT COUNT(*) as count FROM grading_scales");
        if (rows[0].count === 0) {
            await db.query(`
                INSERT INTO grading_scales (name, min_percent, max_percent, descriptor, icon, color) VALUES
                ('Excellent', 90, 100, 'Consistently exceeds academic expectations, demonstrates advanced critical thinking, and shows leadership in collaborative tasks.', 'verified', 'green'),
                ('Good', 75, 89, 'Meets all academic requirements effectively, participates actively in class discussions, and shows steady improvement.', 'thumb_up', 'blue'),
                ('Developing', 50, 74, 'Demonstrates partial understanding of concepts, requires occasional support to complete tasks, but showing potential.', 'trending_up', 'amber'),
                ('Needs Improvement', 0, 49, 'Struggles to meet core requirements, requires significant intervention and scaffolded support to achieve learning outcomes.', 'warning', 'red')
            `);
        }
    } catch (err) {
        console.error('INIT GRADING TABLE ERROR:', err);
    }
};
initGradingTable();
const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/files', express.static(path.join(__dirname, 'files')));
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
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'files/mqreporttemplates';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'test_format_' + uniqueSuffix + path.extname(file.originalname));
  }
});
const templateUpload = multer({ storage: templateStorage });
const schoolUploadFields = upload.fields([
  { name: 'school_logo', maxCount: 1 },
  { name: 'school_image', maxCount: 1 },
  { name: 'time_table_image', maxCount: 1 },
  { name: 'principal_signature_image', maxCount: 1 },
  { name: 'head_coach_signature_image', maxCount: 1 }
]);
app.post('/api/login', async (req, res) => {
  console.log('\n--- LOGIN REQUEST ---');
  console.log('BODY:', req.body);
  const { email, password } = req.body;
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
    if (rows.length === 0) {
      console.log('❌ USER NOT FOUND');
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password!'
      });
    }
    const user = rows[0];
    console.log('✅ USER FOUND:', user.email);
    if (user.is_active !== 1) {
      console.log('❌ USER INACTIVE');
      return res.status(403).json({
        success: false,
        message: 'Account inactive'
      });
    }
    const cleanPassword = password.trim();
    let isMatch = false;
    const isSHA1 = user.password.length === 40;
    const isBcrypt = user.password.startsWith('$2');
    console.log('🔍 HASH TYPE:', isSHA1 ? 'SHA1' : isBcrypt ? 'BCRYPT' : 'UNKNOWN');
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

// 🏫 GET SCHOOLS API (Filtered by Gallery existence if requested)
app.get('/api/schools', async (req, res) => {
  const { hasGallery } = req.query;
  try {
    let query = `
      SELECT s.*, u.name as om_name,
      (SELECT COUNT(*) FROM students src WHERE src.school_id = s.id) as student_count,
      (SELECT COUNT(*) FROM school_gallery sg WHERE sg.school_id = s.id) as gallery_count
      FROM schools s 
      LEFT JOIN users u ON s.mq_om_id = u.id
    `;

    if (hasGallery === 'true') {
      query += ` WHERE EXISTS (SELECT 1 FROM school_gallery sg WHERE sg.school_id = s.id)`;
    } else if (hasGallery === 'false') {
      query += ` WHERE NOT EXISTS (SELECT 1 FROM school_gallery sg WHERE sg.school_id = s.id)`;
    }

    const [rows] = await db.query(query);
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
    if (files['school_image']) data.school_image = files['school_image'][0].filename;
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
    if (files['school_image']) data.school_image = files['school_image'][0].filename;
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

// 🖼️ GET SCHOOL GALLERY PHOTOS
app.get('/api/school-gallery/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM school_gallery WHERE school_id = ? ORDER BY uploaded_at DESC', [id]);
    res.json({ success: true, gallery: rows });
  } catch (err) {
    console.error('FETCH GALLERY ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching gallery' });
  }
});

// 🖼️ UPLOAD GALLERY PHOTOS
app.post('/api/school-gallery/:id', upload.array('photos'), async (req, res) => {
  const { id } = req.params;
  const { category, description } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, message: 'No photos uploaded' });
  }

  try {
    const values = files.map(file => [
      id,
      path.extname(file.originalname).substring(1), // file_type (e.g., jpg)
      file.filename, // file_path
      category || 'General',
      new Date().toISOString().slice(0, 19).replace('T', ' ') // uploaded_at
    ]);

    await db.query(
      'INSERT INTO school_gallery (school_id, file_type, file_path, caption, uploaded_at) VALUES ?',
      [values]
    );

    res.json({ success: true, message: `${files.length} photos uploaded successfully` });
  } catch (err) {
    console.error('UPLOAD GALLERY ERROR:', err);
    res.status(500).json({ success: false, message: 'Error uploading photos', error: err.message });
  }
});

// 📄 GET ALL MATCH REPORTS
app.get('/api/match-reports', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT mr.id, mr.school_id, mr.user_id, mr.file_path, mr.created_at,
             s.name as school_name 
      FROM match_report_card mr
      JOIN schools s ON mr.school_id = s.id
      ORDER BY mr.created_at DESC
    `);
    res.json({ success: true, reports: rows });
  } catch (err) {
    console.error('FETCH REPORTS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching reports', error: err.message });
  }
});

// 📄 UPLOAD MATCH REPORT
app.post('/api/match-reports', upload.single('report'), async (req, res) => {
  const { school_id } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No report file uploaded' });
  }
  if (!school_id) {
    return res.status(400).json({ success: false, message: 'School is required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO match_report_card (school_id, file_path) VALUES (?, ?)',
      [school_id, file.filename]
    );

    res.json({
      success: true,
      message: 'Match report uploaded successfully',
      reportId: result.insertId
    });
  } catch (err) {
    console.error('UPLOAD REPORT ERROR:', err);
    res.status(500).json({ success: false, message: 'Error uploading report', error: err.message });
  }
});

// 👪 GET ALL PARENTS REPORTS
app.get('/api/parents-reports', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM mq_report_parents ORDER BY request_date DESC');
    res.json({ success: true, reports: rows });
  } catch (err) {
    console.error('FETCH PARENTS REPORTS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching parents reports', error: err.message });
  }
});

// 🔗 GET ALL SCHOOL ASSIGNMENTS
app.get('/api/school-assignments', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT 
        u.id as user_id, 
        u.name as user_name, 
        u.email, 
        r.name as role_name,
        r.id as role_id,
        GROUP_CONCAT(s.name SEPARATOR ', ') as assigned_schools,
        GROUP_CONCAT(asgn.school_id SEPARATOR ',') as school_ids,
        COUNT(asgn.school_id) as school_count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN assign_school asgn ON u.id = asgn.user_id
      LEFT JOIN schools s ON asgn.school_id = s.id
      GROUP BY u.id
      ORDER BY u.name ASC
    `);

    const [[stats]] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM assign_school) as total_assignments,
        (SELECT COUNT(DISTINCT school_id) FROM assign_school) as active_institutions,
        (SELECT COUNT(*) FROM users u LEFT JOIN assign_school asgn ON u.id = asgn.user_id WHERE asgn.id IS NULL) as pending_requests,
        (SELECT COUNT(*) FROM users) as total_users
    `);

    res.json({ success: true, assignments: rows, stats: stats });
  } catch (err) {
    console.error('FETCH ASSIGNMENTS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching school assignments', error: err.message });
  }
});

// 👥 GET ALL USERS FOR MANAGEMENT
app.get('/api/users-list', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.mobile, 
        u.is_active,
        r.name as role_name,
        COALESCE(u.mq_id, CONCAT('MQ-', LPAD(u.id, 4, '0'), '-U')) as mq_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
    `);

    const [[stats]] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role_id = 3 THEN 1 ELSE 0 END) as total_ssgm,
        SUM(CASE WHEN role_id IN (4, 5) THEN 1 ELSE 0 END) as total_coaches,
        SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) as total_ops,
        SUM(CASE WHEN role_id IN (1, 7) THEN 1 ELSE 0 END) as total_admins,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as pending_access
      FROM users
    `);

    // Cast SUM results (which may be strings) to Numbers
    const formattedStats = {
      total_users: Number(stats.total_users),
      total_ssgm: Number(stats.total_ssgm || 0),
      total_coaches: Number(stats.total_coaches || 0),
      total_ops: Number(stats.total_ops || 0),
      total_admins: Number(stats.total_admins || 0),
      pending_access: Number(stats.pending_access || 0)
    };

    res.json({ success: true, users: rows, stats: formattedStats });
  } catch (err) {
    console.error('FETCH USERS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching users', error: err.message });
  }
});

// 💾 SAVE SCHOOL ASSIGNMENTS
app.post('/api/school-assignments', async (req, res) => {
  const { user_id, school_ids } = req.body;
  if (!user_id || !Array.isArray(school_ids)) {
    return res.status(400).json({ success: false, message: 'Invalid data provided' });
  }
  try {
    await db.query('DELETE FROM assign_school WHERE user_id = ?', [user_id]);
    if (school_ids.length > 0) {
      const values = school_ids.map(sId => [user_id, sId]);
      await db.query('INSERT INTO assign_school (user_id, school_id) VALUES ?', [values]);
    }
    res.json({ success: true, message: 'Assignments updated successfully' });
  } catch (err) {
    console.error('SAVE ASSIGNMENTS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error saving assignments', error: err.message });
  }
});

// 👥 CREATE NEW USER
app.post('/api/users', async (req, res) => {
  const {
    mq_id, name, email, password, mobile, role_id,
    address_line1, address_line2, city, state, pincode,
    app_access, web_access, remarks
  } = req.body;

  if (!name || !email || !password || !role_id) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const addedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await db.query(
      `INSERT INTO users (
        mq_id, name, email, password, mobile, role_id, 
        address_line1, address_line2, city, state, pincode,
        app_access, web_access, remarks,
        is_active, is_super_admin, added_date, added_ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, '127.0.0.1')`,
      [
        mq_id || null, name, email.toLowerCase().trim(), hashedPassword, mobile, role_id,
        address_line1 || '', address_line2 || '', city || '', state || '', pincode || '',
        app_access ? 1 : 0, web_access ? 1 : 0, remarks || '',
        addedDate
      ]
    );

    res.json({ success: true, message: 'User created successfully', userId: result.insertId });
  } catch (err) {
    console.error('CREATE USER ERROR:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating user', error: err.message });
  }
});

// 🔍 GET SINGLE USER
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = rows[0];
    delete user.password; // Don't send password hash
    res.json({ success: true, user });
  } catch (err) {
    console.error('FETCH USER ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching user', error: err.message });
  }
});

// 🔄 UPDATE USER
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name, email, mobile, role_id,
    address_line1, address_line2, city, state, pincode,
    app_access, web_access, remarks, mq_id
  } = req.body;

  if (!name || !email || !role_id) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    await db.query(
      `UPDATE users SET 
        mq_id = ?, name = ?, email = ?, mobile = ?, role_id = ?, 
        address_line1 = ?, address_line2 = ?, city = ?, state = ?, pincode = ?,
        app_access = ?, web_access = ?, remarks = ?
      WHERE id = ?`,
      [
        mq_id || null, name, email.toLowerCase().trim(), mobile, role_id,
        address_line1 || '', address_line2 || '', city || '', state || '', pincode || '',
        app_access ? 1 : 0, web_access ? 1 : 0, remarks || '',
        id
      ]
    );

    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    console.error('UPDATE USER ERROR:', err);
    res.status(500).json({ success: false, message: 'Error updating user', error: err.message });
  }
});

// 🎓 ADD NEW STUDENT
app.post('/api/students', async (req, res) => {
  const {
    mq_id, name, school_name, standard, division, status
  } = req.body;
  if (!name || !school_name || !standard) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  try {
    // Look up the school ID
    const [schoolRows] = await db.query('SELECT id FROM schools WHERE name = ?', [school_name]);
    const school_id = schoolRows.length > 0 ? schoolRows[0].id : null;

    const [result] = await db.query(
      'INSERT INTO students (mq_id, name, school_id, std, division, status) VALUES (?, ?, ?, ?, ?, ?)',
      [mq_id, name, school_id, standard, division, status || '1']
    );
    res.json({ success: true, message: 'Student created successfully', studentId: result.insertId });
  } catch (err) {
    console.error('CREATE STUDENT ERROR:', err);
    res.status(500).json({ success: false, message: 'Error creating student', error: err.message });
  }
});

// 🎓 GET ALL STUDENTS & DYNAMIC FILTERS
app.get('/api/students', async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT st.*, s.name as school_name 
      FROM students st 
      LEFT JOIN schools s ON st.school_id = s.id 
      ORDER BY st.id DESC
    `);

    // Fetch unique active standards
    const [standardsResult] = await db.query('SELECT DISTINCT std as standard FROM students WHERE std IS NOT NULL AND std != "" ORDER BY std ASC');
    const standards = standardsResult.map(row => row.standard);

    // Fetch unique active divisions
    const [divisionsResult] = await db.query('SELECT DISTINCT division FROM students WHERE division IS NOT NULL AND division != "" ORDER BY division ASC');
    const divisions = divisionsResult.map(row => row.division);

    // Fetch distinct schools from the actual students data
    const [schoolsResult] = await db.query(`
      SELECT DISTINCT s.name as school_name 
      FROM students st 
      JOIN schools s ON st.school_id = s.id 
      WHERE s.name IS NOT NULL AND s.name != "" 
      ORDER BY s.name ASC
    `);
    const schools = schoolsResult.map(row => row.school_name);

    res.json({
      success: true,
      students,
      filters: {
        standards,
        divisions,
        schools
      }
    });
  } catch (err) {
    console.error('FETCH STUDENTS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching students', error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, gender, school_name, standard, division, gr_number, mq_id, status } = req.body;

  if (!name || !school_name || !standard) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Look up the school ID from name
    const [schoolRows] = await db.query('SELECT id FROM schools WHERE name = ?', [school_name]);
    const school_id = schoolRows.length > 0 ? schoolRows[0].id : null;

    // Map status string to int
    const statusVal = (status === 'Active' || status === 1) ? 1 : 0;

    await db.query(
      `UPDATE students SET 
        name = ?, gender = ?, school_id = ?, std = ?, division = ?, 
        roll_number = ?, mq_id = ?, status = ?
       WHERE id = ?`,
      [name, gender || null, school_id, standard, division || null, gr_number || null, mq_id || null, statusVal, id]
    );

    res.json({ success: true, message: 'Student updated successfully' });
  } catch (err) {
    console.error('UPDATE STUDENT ERROR:', err);
    res.status(500).json({ success: false, message: 'Error updating student', error: err.message });
  }
});

// 🎓 GET ALL PARAMETERS
app.get('/api/parameters', async (req, res) => {
  try {
    const [parameters] = await db.query('SELECT * FROM parameter_info ORDER BY id DESC');
    res.json({ success: true, parameters });
  } catch (err) {
    console.error('FETCH PARAMETERS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching parameters', error: err.message });
  }
});

// 🎓 GET GRADING CONFIG
app.get('/api/grading-config', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM grading_scales ORDER BY id ASC');
    res.json({ success: true, tiers: rows });
  } catch (err) {
    console.error('FETCH GRADING CONFIG ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching grading configuration' });
  }
});

// 🎓 UPDATE GRADING CONFIG
app.post('/api/grading-config', async (req, res) => {
  const { tiers } = req.body;
  if (!Array.isArray(tiers)) return res.status(400).json({ success: false, message: 'Invalid tiers data' });

  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    for (const tier of tiers) {
      await connection.query(
        'UPDATE grading_scales SET min_percent = ?, max_percent = ?, descriptor = ? WHERE id = ?',
        [tier.min_percent, tier.max_percent, tier.descriptor, tier.id]
      );
    }
    await connection.commit();
    res.json({ success: true, message: 'Grading configuration updated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('UPDATE GRADING CONFIG ERROR:', err);
    res.status(500).json({ success: false, message: 'Error updating grading configuration' });
  } finally {
    connection.release();
  }
});

// 🎓 CREATE PARAMETER
app.post('/api/parameters', async (req, res) => {
  const { parameter, title, description, test_display, ctype, clabel, video_link, chart_heading, chart_format, is_active } = req.body;

  if (!title || !parameter) {
    return res.status(400).json({ success: false, message: 'Title and System Key (parameter) are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO parameter_info (parameter, title, description, test_display, ctype, clabel, video_link, chart_heading, chart_format, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [parameter, title, description, test_display, ctype, clabel, video_link, chart_heading, chart_format, is_active]
    );

    res.json({ success: true, message: 'Parameter created successfully', id: result.insertId });
  } catch (err) {
    console.error('CREATE PARAMETER ERROR:', err);
    res.status(500).json({ success: false, message: 'Error creating parameter', error: err.message });
  }
});

// 🎓 UPDATE PARAMETER
app.put('/api/parameters/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, test_display, ctype, clabel, video_link, chart_heading, chart_format, is_active } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  try {
    const [result] = await db.query(
      'UPDATE parameter_info SET title = ?, description = ?, test_display = ?, ctype = ?, clabel = ?, video_link = ?, chart_heading = ?, chart_format = ?, is_active = ? WHERE id = ?',
      [title, description, test_display, ctype, clabel, video_link, chart_heading, chart_format, is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Parameter not found' });
    }

    res.json({ success: true, message: 'Parameter updated successfully' });
  } catch (err) {
    console.error('UPDATE PARAMETER ERROR:', err);
    res.status(500).json({ success: false, message: 'Error updating parameter', error: err.message });
  }
});

// 🎓 DELETE PARAMETER
app.delete('/api/parameters/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM parameter_info WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Parameter not found' });
    }
    res.json({ success: true, message: 'Parameter deleted successfully' });
  } catch (err) {
    console.error('DELETE PARAMETER ERROR:', err);
    res.status(500).json({ success: false, message: 'Error deleting parameter', error: err.message });
  }
});

// 🎓 GET ALL EXAM FORMATS
app.get('/api/exam-formats', async (req, res) => {
  try {
    const [formats] = await db.query('SELECT * FROM fitness_test_formats ORDER BY id DESC');
    res.json({ success: true, formats });
  } catch (err) {
    console.error('FETCH EXAM FORMATS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching exam formats', error: err.message });
  }
});

// 🎓 GET SINGLE EXAM FORMAT
app.get('/api/exam-formats/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [formats] = await db.query('SELECT * FROM fitness_test_formats WHERE id = ?', [id]);
    if (formats.length === 0) {
      return res.status(404).json({ success: false, message: 'Format not found' });
    }
    const [parameters] = await db.query(
      'SELECT parameter_id, parameter_order, is_required FROM fitness_test_format_parameters WHERE format_id = ? ORDER BY parameter_order',
      [id]
    );
    res.json({ success: true, format: formats[0], selectedParameters: parameters });
  } catch (err) {
    console.error('FETCH EXAM FORMAT DETAIL ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching exam format details' });
  }
});

// 🎓 CREATE EXAM FORMAT
app.post('/api/exam-formats', templateUpload.single('background_image'), async (req, res) => {
  const { test_name, test_title, academic_year, is_active, parameters } = req.body;
  const background_image = req.file ? `files/mqreporttemplates/${req.file.filename}` : null;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [formatResult] = await connection.query(
      'INSERT INTO fitness_test_formats (test_name, test_title, academic_year, background_image, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [test_name, test_title, academic_year, background_image, is_active || 1, 1] // Using 1 for created_by
    );
    const newFormatId = formatResult.insertId;

    if (parameters) {
      const paramsArray = JSON.parse(parameters);
      for (const p of paramsArray) {
        await connection.query(
          'INSERT INTO fitness_test_format_parameters (format_id, parameter_id, parameter_order, is_required) VALUES (?, ?, ?, ?)',
          [newFormatId, p.parameter_id, p.parameter_order, p.is_required]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Exam format created successfully', id: newFormatId });
  } catch (err) {
    await connection.rollback();
    console.error('CREATE EXAM FORMAT ERROR:', err);
    res.status(500).json({ success: false, message: 'Error creating exam format' });
  } finally {
    connection.release();
  }
});

// 🎓 UPDATE EXAM FORMAT
app.put('/api/exam-formats/:id', templateUpload.single('background_image'), async (req, res) => {
  const { id } = req.params;
  const { test_name, test_title, academic_year, is_active, parameters } = req.body;
  const new_background_image = req.file ? `files/mqreporttemplates/${req.file.filename}` : null;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Get current image to delete if Replaced
    let background_image_to_use = null;
    const [currentFormat] = await connection.query('SELECT background_image FROM fitness_test_formats WHERE id = ?', [id]);

    if (new_background_image) {
      background_image_to_use = new_background_image;
      if (currentFormat.length > 0 && currentFormat[0].background_image) {
        const oldFile = path.join(__dirname, currentFormat[0].background_image);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    } else {
      background_image_to_use = currentFormat.length > 0 ? currentFormat[0].background_image : null;
    }

    // 2. Update Master Table
    await connection.query(
      'UPDATE fitness_test_formats SET test_name = ?, test_title = ?, academic_year = ?, background_image = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [test_name, test_title, academic_year, background_image_to_use, is_active, id]
    );

    // 3. Sync Parameters (Delete and Re-insert)
    await connection.query('DELETE FROM fitness_test_format_parameters WHERE format_id = ?', [id]);
    if (parameters) {
      const paramsArray = JSON.parse(parameters);
      for (const p of paramsArray) {
        await connection.query(
          'INSERT INTO fitness_test_format_parameters (format_id, parameter_id, parameter_order, is_required) VALUES (?, ?, ?, ?)',
          [id, p.parameter_id, p.parameter_order, p.is_required]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Exam format updated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('UPDATE EXAM FORMAT ERROR:', err);
    res.status(500).json({ success: false, message: 'Error updating exam format' });
  } finally {
    connection.release();
  }
});

// 🎓 DELETE EXAM FORMAT
app.delete('/api/exam-formats/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM fitness_test_formats WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Exam format not found' });
    }
    res.json({ success: true, message: 'Exam format deleted successfully' });
  } catch (err) {
    console.error('DELETE EXAM FORMAT ERROR:', err);
    res.status(500).json({ success: false, message: 'Error deleting exam format', error: err.message });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});