const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const morgan = require('morgan');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { PDFDocument, rgb, StandardFonts, degrees, PageSizes } = require('pdf-lib');
const archiver = require('archiver');
require('dotenv').config();
const db = require('./db');

// ── UTILS ──
function wrapText(text, maxW, font, fontSize) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
    if (width < maxW) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// ── GET OR CREATE REPORT KEY (Matched to Legacy PHP Logic) ──
async function getOrCreateReportKey(resultId, db) {
  try {
    // 1. Check if table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'fitness_test_report_access'");
    if (tables.length === 0) {
      console.log(`[PDF] Table 'fitness_test_report_access' missing, using simple fallback`);
      return `fitness-${resultId}B${Math.floor(Date.now() / 1000)}`;
    }

    // 2. Already exists?
    const [existing] = await db.query("SELECT report_key FROM fitness_test_report_access WHERE result_id = ?", [resultId]);
    if (existing.length > 0 && existing[0].report_key) {
      return existing[0].report_key;
    }

    // 3. Not found, create new one based on result details
    const [[result]] = await db.query(`
      SELECT ftr.*, s.name as student_name, s.std, s.division 
      FROM fitness_test_results ftr 
      JOIN students s ON ftr.student_id = s.id 
      WHERE ftr.id = ?
    `, [resultId]);

    if (!result) return `fitness-${resultId}B${Math.floor(Date.now() / 1000)}`;

    // 4. Mimic generateUniqueReportKey hashing logic
    // $base_string = $result->id . '-' . $result->student_id . '-' . $result->format_id . '-' . $result->academic_year . '-' . $result->term;
    // $hash = md5($base_string . time() . rand(1000, 9999));
    // return substr($hash, 0, 12) . 'B' . $result->id;
    const baseString = `${result.id}-${result.student_id}-${result.format_id}-${result.academic_year}-${result.term}`;
    const randPart = Math.floor(Math.random() * 9000) + 1000;
    const hashData = baseString + Math.floor(Date.now() / 1000) + randPart;
    const hash = crypto.createHash('md5').update(hashData).digest('hex');
    const reportKey = hash.substring(0, 12) + 'B' + result.id;

    // 5. Insert
    await db.query("INSERT INTO fitness_test_report_access (result_id, report_key, created_at) VALUES (?, ?, NOW())", [resultId, reportKey]);
    return reportKey;

  } catch (err) {
    console.error('[PDF] Error in getOrCreateReportKey:', err);
    return `fitness-${resultId}B${Math.floor(Date.now() / 1000)}`;
  }
}

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

  // ✅ Validation
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
    const addedDate = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    // ✅ Generate UNIQUE hash_key (FIX)
    const hashKey = crypto.randomBytes(20).toString("hex");

    // ✅ Check if user already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [formattedEmail]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // ✅ Insert user (INCLUDING hash_key)
    const [result] = await db.query(
      `INSERT INTO users (
        email, password, name, is_active, 
        is_super_admin, role_id, added_date, 
        mobile, address_line1, address_line2, 
        city, state, pincode, remarks, profile_pic,
        app_access, web_access, added_by, added_ip,
        hash_key
      ) VALUES (?, ?, ?, 1, 0, 2, ?, '', '', '', '', '', '', '', '', 1, 1, 0, '127.0.0.1', ?)`,
      [formattedEmail, hashedPassword, fullName, addedDate, hashKey]
    );

    console.log('🎉 REGISTRATION SUCCESS:', formattedEmail);

    return res.status(201).json({
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

app.get('/api/users/coaches', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM users WHERE role_id IN (4, 5) AND is_active = 1 ORDER BY name ASC');
    res.json({ success: true, coaches: rows });
  } catch (err) {
    console.error('FETCH COACHES ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching coaches' });
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

// 🎓 ADD NEW STUDENT (Smart Endpoint: Supports IDs and Names)
app.post('/api/students', async (req, res) => {
  const {
    mq_id, name, school_id, school_name, std, standard, division, status, roll_number
  } = req.body;

  // 1. Unified field resolution (std/standard, school_id/school_name)
  const resolvedStd = std || standard;
  const resolvedName = name;
  let resolvedSchoolId = school_id;

  if (!resolvedName || !resolvedStd) {
    return res.status(400).json({ success: false, message: 'Missing mandatory fields (Name, Standard)' });
  }

  try {
    // 2. Resolve school_id from school_name if needed
    if (!resolvedSchoolId && school_name) {
      const [schoolRows] = await db.query('SELECT id FROM schools WHERE name = ?', [school_name]);
      if (schoolRows.length > 0) resolvedSchoolId = schoolRows[0].id;
    }

    if (!resolvedSchoolId) {
      return res.status(400).json({ success: false, message: 'Invalid or missing School' });
    }

    // 3. Duplicate check for MQ ID (if provided)
    if (mq_id) {
      const [existing] = await db.query('SELECT id FROM students WHERE mq_id = ? AND mq_id IS NOT NULL', [mq_id]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: `Student with MQ ID ${mq_id} already exists` });
      }
    }

    // 4. Insert Student
    const [result] = await db.query(
      'INSERT INTO students (mq_id, name, school_id, std, division, roll_number, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [mq_id || null, resolvedName, resolvedSchoolId, resolvedStd, division || '', roll_number || '', status || '1']
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
    const [formats] = await db.query('SELECT id, test_name, test_title, academic_year FROM fitness_test_formats WHERE is_active = 1 ORDER BY test_name');
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


app.get('/api/exam-formats', async (req, res) => {
  try {
    const [rows] = await db.query(`
            SELECT id, test_name, test_title, academic_year 
            FROM fitness_test_formats 
            WHERE is_active = 1 
            ORDER BY test_name
        `);

    res.json({ success: true, formats: rows });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ======================================================
   2. FILTERS
====================================================== */
app.get('/api/fill-marks/filters', async (req, res) => {
  const { school_id } = req.query;

  try {
    const [schools] = await db.query(`
            SELECT id, name FROM schools ORDER BY name
        `);

    let standards;
    if (school_id) {
      [standards] = await db.query(`
                SELECT DISTINCT std AS name, std AS id
                FROM students
                WHERE school_id = ?
                ORDER BY CAST(std AS UNSIGNED)
            `, [school_id]);
    } else {
      [standards] = await db.query(`
                SELECT std_code AS id, name 
                FROM stds_master 
                WHERE is_active = 1
            `);
    }

    const divisions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const terms = ['Term 1', 'Term 2'];

    res.json({
      success: true,
      filters: { schools, standards, divisions, terms }
    });

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ======================================================
   3. FORMAT PARAMETERS
====================================================== */
app.get('/api/fill-marks/format/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
            SELECT 
                fp.parameter_id AS id,
                fp.parameter_order,
                fp.is_required,
                pi.title, 
                pi.ctype, 
                pi.description
            FROM fitness_test_format_parameters fp
            JOIN parameter_info pi ON fp.parameter_id = pi.id
            WHERE fp.format_id = ?
            ORDER BY fp.parameter_order
        `, [req.params.id]);

    res.json({ success: true, parameters: rows });

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ======================================================
   4. STUDENTS + MARKS + RANGES
====================================================== */
app.get('/api/fill-marks/students', async (req, res) => {
  const { school_id, std, division, format_id, term } = req.query;
  if (!school_id || !std || !division || !format_id || !term) {
    return res.json({ success: false, error: 'Missing parameters' });
  }

  // Normalize term
  let normalizedTerm = term;
  if (term === 'Term 1' || term === '1') normalizedTerm = 'term1';
  else if (term === 'Term 2' || term === '2') normalizedTerm = 'term2';

  try {
    /* ---------- 1. STUDENTS ---------- */
    const [students] = await db.query(`
            SELECT a.*, b.name as school_name
            FROM students a
            LEFT JOIN schools b ON a.school_id = b.id
            WHERE a.school_id = ?
            AND a.std = ?
            AND a.division = ?
            ORDER BY a.id
        `, [school_id, std, division]);

    if (students.length === 0) {
      return res.json({ success: true, students: [], ranges: [] });
    }

    const studentIds = students.map(s => s.id);

    /* ---------- 2. PARAMETERS ---------- */
    const [params] = await db.query(`
            SELECT fp.parameter_id, pi.title, pi.ctype, pi.parameter
            FROM fitness_test_format_parameters fp
            JOIN parameter_info pi ON fp.parameter_id = pi.id
            WHERE fp.format_id = ?
        `, [format_id]);

    /* ---------- 3. EXISTING MARKS ---------- */
    const [results] = await db.query(`
            SELECT ftr.student_id, ftrv.parameter_id, ftrv.parameter_value
            FROM fitness_test_results ftr
            LEFT JOIN fitness_test_result_values ftrv 
                ON ftr.id = ftrv.result_id
            WHERE ftr.format_id = ?
            AND ftr.term = ?
            AND ftr.student_id IN (?)
        `, [format_id, normalizedTerm, studentIds]);

    const marksMap = {};

    results.forEach(r => {
      if (!marksMap[r.student_id]) {
        marksMap[r.student_id] = {};
      }

      let value = r.parameter_value;

      const param = params.find(p => p.parameter_id == r.parameter_id);

      // YES/NO conversion (same as PHP)
      if (param && ['yes/no', 'Yes/No', 'boolean', 'Boolean'].includes(param.ctype)) {
        if (value === '1.00') value = 'Yes';
        if (value === '0.00') value = 'No';
      }

      marksMap[r.student_id][r.parameter_id] = value;
    });

    /* ---------- 4. ATTACH MARKS ---------- */
    const finalStudents = students.map(s => ({
      ...s,
      marks: marksMap[s.id] || {}
    }));

    /* ---------- 5. PARAMETER RANGES (From parameter_grades) ---------- */
    let ranges = [];

    if (params.length > 0) {
      const parameterToIdMap = {};
      params.forEach(p => {
        if (p.parameter) parameterToIdMap[p.parameter] = p.parameter_id;
      });

      const paramIdentifiers = Object.keys(parameterToIdMap);

      if (paramIdentifiers.length > 0) {
        // We query all grades for these parameters and the specific standard AND standard 0
        let query = `
                  SELECT 
                      parameter,
                      MIN(min_score) as min_val,
                      MAX(max_score) as max_val,
                      std as std_code
                  FROM parameter_grades
                  WHERE parameter IN (?)
                  AND std IN (?, 0)
                  GROUP BY parameter, std
                  ORDER BY std DESC
              `;

        const [rangeRows] = await db.query(query, [paramIdentifiers, std || 0]);

        const seenRange = new Set();
        ranges = [];

        for (const row of rangeRows) {
          const originalParamId = parameterToIdMap[row.parameter];
          if (originalParamId && !seenRange.has(originalParamId)) {
            ranges.push({
              ...row,
              parameter_id: originalParamId
            });
            seenRange.add(originalParamId);
          }
        }
      }
    }

    res.json({
      success: true,
      students: finalStudents,
      ranges
    });

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

/* ======================================================
   5. SAVE MARKS (PHP Parity)
====================================================== */
app.post('/api/fill-marks/save', async (req, res) => {
  const {
    format_id, school_id, std, division, term,
    entry_mode = 'division',
    examiner_name = '', examiner_signature_id = 0,
    marks = [], partial_save = false
  } = req.body;

  // ── 1. Normalize term ──
  let normalizedTerm = term;
  if (term === 'Term 1' || term === '1') normalizedTerm = 'term1';
  else if (term === 'Term 2' || term === '2') normalizedTerm = 'term2';

  // ── 2. Validate ──
  if (!format_id || !school_id || !normalizedTerm || marks.length === 0) {
    return res.json({ success: false, message: 'Missing required parameters' });
  }
  if (!['term1', 'term2'].includes(normalizedTerm)) {
    return res.json({ success: false, message: `Invalid term: ${normalizedTerm}` });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ── 3. Fetch format info ──
    const [[format]] = await conn.query('SELECT * FROM fitness_test_formats WHERE id = ? AND is_active = 1', [format_id]);
    if (!format) {
      conn.release();
      return res.json({ success: false, message: 'Test format not found or inactive' });
    }
    const academic_year = format.academic_year;

    // ── 4. Fetch format parameters (for Yes/No detection) ──
    const [params] = await conn.query(`
      SELECT fp.parameter_id, pi.title, pi.ctype
      FROM fitness_test_format_parameters fp
      JOIN parameter_info pi ON fp.parameter_id = pi.id
      WHERE fp.format_id = ?
    `, [format_id]);

    const paramMap = {};
    params.forEach(p => { paramMap[p.parameter_id] = p; });

    // ── 5. Group marks by student ──
    const studentMarks = {};
    marks.forEach(m => {
      const sid = parseInt(m.student_id);
      const pid = parseInt(m.parameter_id);
      if (!sid || !pid) return;
      if (!studentMarks[sid]) studentMarks[sid] = [];
      studentMarks[sid].push({ parameter_id: pid, value: m.value });
    });

    let savedCount = 0;
    let savedItems = [];
    const testDate = new Date().toISOString().slice(0, 10);

    // ── 6. Process each student ──
    for (const [studentIdStr, marksData] of Object.entries(studentMarks)) {
      const studentId = parseInt(studentIdStr);

      // Check if result already exists for this student + format + term + academic_year
      const [existingRows] = await conn.query(
        `SELECT id FROM fitness_test_results
         WHERE format_id = ? AND student_id = ? AND academic_year = ? AND term = ?`,
        [format_id, studentId, academic_year, normalizedTerm]
      );

      let resultId;

      if (existingRows.length > 0) {
        // ── UPDATE existing result ──
        resultId = existingRows[0].id;
        await conn.query(
          `UPDATE fitness_test_results SET examiner_name = ?, examiner_signature_id = ?, updated_at = NOW() WHERE id = ?`,
          [examiner_name, examiner_signature_id || null, resultId]
        );

        // Delete existing parameter values for clean re-insert
        await conn.query('DELETE FROM fitness_test_result_values WHERE result_id = ?', [resultId]);

      } else {
        // ── INSERT new result ──
        const reportKey = 'FT_' + testDate.replace(/-/g, '') + '_' + Math.random().toString(16).slice(2, 10).toUpperCase();
        const [insertRes] = await conn.query(
          `INSERT INTO fitness_test_results
           (format_id, student_id, academic_year, term, test_date, examiner_id, examiner_name, examiner_signature_id, report_key)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [format_id, studentId, academic_year, normalizedTerm, testDate, 0, examiner_name, examiner_signature_id || null, reportKey]
        );
        resultId = insertRes.insertId;
      }

      // ── 7. Insert parameter values ──
      // Deduplicate by parameter_id
      const seen = {};
      const uniqueMarks = [];
      marksData.forEach(m => {
        if (!seen[m.parameter_id]) { uniqueMarks.push(m); seen[m.parameter_id] = true; }
      });

      for (const mark of uniqueMarks) {
        let storageValue = mark.value;
        if (storageValue === '' || storageValue === null || storageValue === undefined) continue;

        // Yes/No → 1/0 conversion
        const paramInfo = paramMap[mark.parameter_id];
        const isYesNo = paramInfo && ['yes/no', 'boolean', 'y/n', 'true/false', 't/f'].includes((paramInfo.ctype || '').toLowerCase());
        if (isYesNo) {
          if (String(storageValue).toLowerCase() === 'yes') storageValue = '1';
          else if (String(storageValue).toLowerCase() === 'no') storageValue = '0';
        }

        await conn.query(
          `INSERT INTO fitness_test_result_values (result_id, parameter_id, parameter_value, created_at)
           VALUES (?, ?, ?, NOW())`,
          [resultId, mark.parameter_id, storageValue]
        );

        savedItems.push({ student_id: studentId, parameter_id: mark.parameter_id });
      }

      savedCount++;
    }

    await conn.commit();

    const message = partial_save
      ? `Progress saved! ${savedItems.length} parameter values saved.`
      : `Successfully saved marks for ${savedCount} students.`;

    res.json({
      success: true,
      message,
      saved_count: savedCount,
      format_name: format.test_name,
      academic_year
    });

  } catch (err) {
    await conn.rollback();
    console.error('SAVE FILL-MARKS ERROR:', err);
    res.json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// 🎓 GET STANDARDS
app.get('/api/standards', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT std_code as id, name, std_code 
      FROM stds_master 
      WHERE is_active = 1 
      ORDER BY CAST(std_code AS UNSIGNED)
    `);
    res.json({ success: true, standards: rows });
  } catch (err) {
    console.error('GET STANDARDS ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🎓 GET PARAMETER GRADES
app.get('/api/parameter-grades', async (req, res) => {
  try {
    const { parameter, std } = req.query;
    if (!parameter) {
      return res.status(400).json({ success: false, message: "parameter missing" });
    }

    // Fallback to std=0 if not provided
    const stdCode = std ? parseInt(std) : 0;

    // Support matching both '92' and 'param92'
    const [rows] = await db.query(
      'SELECT * FROM parameter_grades WHERE parameter IN (?, ?) AND std = ? ORDER BY max_score DESC',
      [parameter, parameter, stdCode]
    );
    res.json({ success: true, grades: rows });
  } catch (err) {
    console.error('GET PARAMETER GRADES ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🎓 POST PARAMETER GRADES
app.post('/api/parameter-grades/save', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { parameter, std_codes, grades } = req.body;
    if (!parameter || !grades || !Array.isArray(std_codes)) {
      throw new Error("Missing parameter, grades array or std_codes array");
    }
    const dbParameterId = parameter.toString().startsWith('param') ? parameter : parameter;
    for (const std of std_codes) {
      const stdCode = parseInt(std) || 0;
      await conn.query('DELETE FROM parameter_grades WHERE parameter IN (?, ?) AND std = ?', [parameter, dbParameterId, stdCode]);
      for (const g of grades) {
        await conn.query(
          'INSERT INTO parameter_grades (std, parameter, min_score, max_score, grade, grade_label) VALUES (?, ?, ?, ?, ?, ?)',
          [stdCode, dbParameterId, g.min_score || 0, g.max_score || 0, g.grade || '', g.grade_label || '']
        );
      }
    }

    await conn.commit();
    res.json({ success: true, message: "Parameter grades saved successfully!" });
  } catch (err) {
    await conn.rollback();
    console.error('SAVE PARAMETER GRADES ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});


// 🎓 GRADING HELPER (PHP Parity)
function calculateGrade(value, ranges) {
  if (value === null || value === '' || value === 'AB' || value === 'ab' || value === 'Ab') {
    return 'A+';
  }
  const val = parseFloat(value);
  if (isNaN(val)) return 'A+';

  for (const range of ranges) {
    if (val >= range.min_score && val <= range.max_score) {
      return range.grade;
    }
  }
  return 'A+';
}

// 🎓 GET STUDENTS FOR REPORT CARD
app.get('/api/reports/students', async (req, res) => {
  try {
    const { school_id, std, division, academic_year, term } = req.query;

    let query = `
            SELECT DISTINCT s.id, s.name, s.mq_id, s.std, s.division, ftr.id as result_id
            FROM students s
            JOIN fitness_test_results ftr ON s.id = ftr.student_id
            WHERE 1=1
        `;

    const params = [];
    if (school_id) { query += ' AND s.school_id = ?'; params.push(school_id); }
    if (std) { query += ' AND s.std = ?'; params.push(std); }
    if (division) { query += ' AND s.division = ?'; params.push(division); }
    if (academic_year) { query += ' AND ftr.academic_year = ?'; params.push(academic_year); }
    if (term) {
      let normalizedTerm = term;
      if (term === '1') normalizedTerm = 'term1';
      if (term === '2') normalizedTerm = 'term2';
      query += ' AND ftr.term = ?'; params.push(normalizedTerm);
    }

    // ── Pagination/Lazy Load Support ──
    const limit = parseInt(req.query.limit) || 10000;
    const offset = parseInt(req.query.offset) || 0;

    // Get total count
    const countQuery = `SELECT COUNT(DISTINCT s.id) as total FROM students s JOIN fitness_test_results ftr ON s.id = ftr.student_id WHERE 1=1 ${query.split('WHERE 1=1')[1]}`;
    const [[{ total }]] = await db.query(countQuery, params);

    // Grouping by student ID to avoid duplicates (Term 1 & 2 usually create 2 rows)
    query = query.replace('SELECT s.id, s.name, s.mq_id, s.std, s.division, ftr.id as result_id', 'SELECT s.id, s.name, s.mq_id, s.std, s.division, MAX(ftr.id) as result_id');
    query += ' GROUP BY s.id ORDER BY s.name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    res.json({ success: true, students: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🎓 GET DETAILED REPORT DATA
app.get('/api/reports/data/:result_id', async (req, res) => {
  try {
    const { result_id } = req.params;

    // 1. Get Result & Student & School Info
    const [[result]] = await db.query(`
            SELECT ftr.*, s.name as student_name, s.mq_id, s.std, s.division, 
                   sch.name as school_name, sch.school_logo
            FROM fitness_test_results ftr
            JOIN students s ON ftr.student_id = s.id
            JOIN schools sch ON s.school_id = sch.id
            WHERE ftr.id = ?
        `, [result_id]);

    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    // 2. Get Parameters for this format
    const [params] = await db.query(`
            SELECT pi.id, pi.title, pi.parameter, pi.ctype, ftrv.parameter_value
            FROM fitness_test_format_parameters fp
            JOIN parameter_info pi ON fp.parameter_id = pi.id
            LEFT JOIN fitness_test_result_values ftrv ON pi.id = ftrv.parameter_id AND ftrv.result_id = ?
            WHERE fp.format_id = ?
            ORDER BY fp.parameter_order
        `, [result_id, result.format_id]);

    // 3. Get Grading Ranges for this standard
    const [ranges] = await db.query(`
            SELECT * FROM parameter_grades 
            WHERE std IN (?, 0)
        `, [result.std]);

    // 4. Calculate Grades
    const reportData = params.map(p => {
      const paramRanges = ranges.filter(r => r.parameter === p.parameter);
      const grade = calculateGrade(p.parameter_value, paramRanges);
      return {
        ...p,
        grade
      };
    });

    res.json({
      success: true,
      student: {
        name: result.student_name,
        mq_id: result.mq_id,
        std: result.std,
        division: result.division,
        school: result.school_name
      },
      results: reportData
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 📄 PDF GENERATION + ZIP DOWNLOAD
// ─────────────────────────────────────────────────────────────────

const PDF_TEMP_DIR = path.join(__dirname, 'temp', 'pdfs');
if (!fs.existsSync(PDF_TEMP_DIR)) fs.mkdirSync(PDF_TEMP_DIR, { recursive: true });

// Helper: draw a rounded rectangle
function drawRoundedRect(page, x, y, w, h, color) {
  page.drawRectangle({ x, y, width: w, height: h, color, borderColor: color, borderWidth: 0 });
}

// Helper: normalize std to numeric for grade lookup (same as PHP)
function normalizeStd(std) {
  const map = {
    'Nursery': '-2', 'Jr.Kg': '-1', 'Jr Kg': '-1', 'JrKg': '-1',
    'Sr.Kg': '0', 'Sr Kg': '0', 'SrKg': '0',
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
    'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
    'XI': '11', 'XII': '12',
  };
  const match = String(std).match(/^([IVX]+|Nursery|Jr\.?Kg|Sr\.?Kg)/i);
  if (match && map[match[1]]) return map[match[1]];
  return String(std);
}

// Helper: get grade color as rgb
function gradeToColor(grade) {
  const g = (grade || '').toUpperCase();
  if (g === 'A+') return rgb(0.243, 0.612, 0.882); // light blue
  if (g === 'A') return rgb(0.243, 0.612, 0.882);
  if (g === 'B+') return rgb(0.902, 0.569, 0.22); // orange
  if (g === 'B') return rgb(0.902, 0.569, 0.22);
  return rgb(0.58, 0.65, 0.65);
}

// ── Helper: Draw QR Code Section (Ported from PHP) ──
async function addQRCodeSection(pdfDoc, page, resultId, yMM, helpers) {
  const { px, py, fontBold, fontReg, black, white, gray, width, height } = helpers;

  // Matching PHP legacy code exactly:
  const marginX = 10;
  const boxW = 210 - (marginX * 2); // 190mm
  const boxH = 60;
  const boxX = px(marginX);
  const boxYMM = yMM + 3;

  const qrSize = 52;
  const logoSize = 12;
  const innerTopPad = 6;
  const radius = 3.5;
  const bgPadding = 2.0;

  // 1. Draw border box
  page.drawRectangle({
    x: boxX, y: py(boxYMM, boxH),
    width: px(boxW), height: px(boxH),
    borderColor: black,
    borderWidth: 0.7
  });

  // 2. Generate QR Code
  const reportKey = await getOrCreateReportKey(resultId, db);
  const qrUrl = `https://app.marcosquay.com/reportcard/index.php?k=${reportKey}`;
  console.log(`[PDF] Generated QR URL for result_id ${resultId}: ${qrUrl}`);

  try {
    const qrDataUri = await QRCode.toDataURL(qrUrl, { margin: 1, errorCorrectionLevel: 'H' });
    const qrImageBytes = Buffer.from(qrDataUri.split(',')[1], 'base64');
    const qrImg = await pdfDoc.embedPng(qrImageBytes);

    const qrX = boxX + px(6);
    const qrY = py(boxYMM, boxH) + px(innerTopPad + (boxH - innerTopPad * 2 - qrSize) / 2);

    page.drawImage(qrImg, {
      x: qrX, y: qrY,
      width: px(qrSize), height: px(qrSize)
    });

    // ── MQ Logo in center of QR ──
    const mqLogoPath = path.join(__dirname, '../src/assets/new_logo.png');
    if (fs.existsSync(mqLogoPath)) {
      const mqBytes = fs.readFileSync(mqLogoPath);
      const mqLogo = await pdfDoc.embedPng(mqBytes);

      const qrCenterX = qrX + px(qrSize / 2);
      const qrCenterY = qrY + px(qrSize / 2);
      const bgW = px(logoSize + (2 * bgPadding));

      // White background for logo (rounded-ish)
      page.drawRectangle({
        x: qrCenterX - bgW / 2, y: qrCenterY - bgW / 2,
        width: bgW, height: bgW,
        color: white,
        opacity: 1
      });

      const mqDims = mqLogo.scaleToFit(px(logoSize), px(logoSize));
      page.drawImage(mqLogo, {
        x: qrCenterX - mqDims.width / 2,
        y: qrCenterY - mqDims.height / 2,
        width: mqDims.width,
        height: mqDims.height
      });
    }
  } catch (err) {
    console.error('QR Error:', err);
  }

  // 3. Text content
  const textX = boxX + px(qrSize + 14); // qrX(box+6) + qrSize + 8
  const textW = px(boxW - (qrSize + 20));
  const lineH = 5.5;

  const subtitles = [
    "Simple explanations of each activity",
    "Videos showing how each test works",
    "Progress tracking across the year"
  ];

  const textTitle = "Scan the QR code to unlock:";
  const totalLines = 1 + subtitles.length + 1; // title + subs + 1 space
  const textHeightTotal = lineH * totalLines;

  let textY = py(boxYMM, boxH) + px(boxH) - px((boxH - textHeightTotal) / 2 + lineH);

  // Title (14pt Bold)
  page.drawText(textTitle, {
    x: textX, y: textY,
    size: 14, font: fontBold, color: rgb(0.15, 0.15, 0.15)
  });

  textY -= px(lineH * 2);

  // Subtitles (12pt Bold)
  for (const sub of subtitles) {
    page.drawText("• " + sub, {
      x: textX, y: textY,
      size: 12, font: fontBold, color: rgb(0.15, 0.15, 0.15)
    });
    textY -= px(lineH);
  }

  return boxYMM + boxH + 5;
}

// 📄 BUILD PDF FOR ONE RESULT — with optional simplified options
async function buildReportPDF(resultId, options = {}) {
  const {
    selectedTerm = 'both', // 'term1', 'term2', or 'both'
    showScanner = false
  } = options;

  // ── 1. Fetch result + student + school ──
  const [[result]] = await db.query(`
        SELECT ftr.*, ft.test_name, ft.test_title, ft.academic_year,
               s.name as student_name, s.mq_id, s.std, s.division, s.gender, s.school_id,
               sch.name as school_name, sch.school_logo,
               sch.show_principal_signature, sch.principal_name, sch.principal_designation, sch.principal_signature_image,
               sch.head_coach_name, sch.head_coach_designation,
               sch.show_head_coach_signature, sch.head_coach_signature_image
        FROM fitness_test_results ftr
        JOIN fitness_test_formats ft ON ftr.format_id = ft.id
        JOIN students s ON ftr.student_id = s.id
        JOIN schools sch ON s.school_id = sch.id
        WHERE ftr.id = ?
    `, [resultId]);

  console.log(`[PDF] Result fetched for ID: ${resultId}, Found: ${!!result}`);
  if (!result) throw new Error(`Result ${resultId} not found`);

  // ── 2. Multi-term detection ──
  // If SelectedTerm override is provided, use it. Otherwise, autodetect.
  let isMultiTerm = false;
  if (selectedTerm === 'both') {
    isMultiTerm = true;
  } else if (selectedTerm === 'term1' || selectedTerm === 'term2') {
    isMultiTerm = false;
  } else {
    // Autodetect from DB
    const [termRows] = await db.query(
      `SELECT DISTINCT term FROM fitness_test_results
           WHERE student_id = ? AND format_id = ? AND term IS NOT NULL AND term != ''
           ORDER BY term`,
      [result.student_id, result.format_id]
    );
    isMultiTerm = termRows.length > 1;
  }


  // ── 3. Fetch parameters ──
  const [params] = await db.query(`
        SELECT pi.id, pi.title, pi.parameter, pi.ctype, pi.test_display, pi.description,
               ftrv.parameter_value, fp.parameter_order
        FROM fitness_test_format_parameters fp
        JOIN parameter_info pi ON fp.parameter_id = pi.id
        LEFT JOIN fitness_test_result_values ftrv ON pi.id = ftrv.parameter_id AND ftrv.result_id = ?
        WHERE fp.format_id = ?
        ORDER BY fp.parameter_order
    `, [resultId, result.format_id]);

  // ── 4. Grading ranges ──
  const stdNorm = normalizeStd(result.std);
  const [ranges] = await db.query(`SELECT * FROM parameter_grades WHERE std = ?`, [stdNorm]);
  console.log(`[PDF] Grading ranges fetched: ${ranges.length}`);

  // ── 5. Build PDF ──
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  console.log(`[PDF] Fonts embedded`);

  // ── BACKGROUND IMAGE ──
  try {
    const bgPath = path.join(__dirname, '../src/assets/background_of_report_card.png');
    if (fs.existsSync(bgPath)) {
      const bgBytes = fs.readFileSync(bgPath);
      const bgImg = await pdfDoc.embedPng(bgBytes);
      if (bgImg) {
        page.drawImage(bgImg, {
          x: 0,
          y: 0,
          width: width,
          height: height,
          opacity: 1 // Background image should be fully opaque or as designed
        });
        console.log(`[PDF] Background image embedded: ${bgPath}`);
      }
    } else {
      console.warn(`[PDF] Background image NOT found at: ${bgPath}`);
    }
  } catch (err) {
    console.error(`[PDF] Error embedding background image:`, err);
  }

  // mm → points helpers (pdf-lib origin = bottom-left)
  const MM = 2.835;
  const px = mm => mm * MM;                          // x: left→right
  const py = (mm, hMM = 0) => height - (mm + hMM) * MM; // y: top→bottom

  // PHP-matching colors
  const titleBg = rgb(0.655, 0.729, 0.882); // rgb(167, 186, 255)
  const tableHeaderBg = rgb(0.553, 0.678, 0.859); // rgb(141, 173, 219)
  const rowBg = rgb(0.922, 0.945, 0.976); // rgb(235, 241, 249)
  const blueBorder = rgb(0.204, 0.471, 0.757); // rgb(52, 120, 193)
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  const textDark = rgb(0.129, 0.129, 0.129); // rgb(33,33,33)
  const textMed = rgb(0.173, 0.243, 0.314); // rgb(44,62,80)
  const gray = rgb(0.42, 0.42, 0.42);

  // ── MARCOS QUAY LOGO (Default positions, no sliders) ──
  try {
    const mqLogoPath = path.join(__dirname, '../src/assets/new_logo.png');
    if (fs.existsSync(mqLogoPath)) {
      const mqBytes = fs.readFileSync(mqLogoPath);
      const mqEmb = await pdfDoc.embedPng(mqBytes);
      if (mqEmb) {
        const mqDims = mqEmb.scaleToFit(px(40), px(20));
        page.drawImage(mqEmb, {
          x: px(15), y: py(10) - mqDims.height,
          width: mqDims.width, height: mqDims.height,
        });
      }
    }
  } catch (err) { }

  // ── SCHOOL LOGO ──
  if (result.school_logo) {
    try {
      const logoPath = path.join(__dirname, 'uploads', result.school_logo);
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        let embeddedLogo;
        if (logoPath.toLowerCase().endsWith('.png')) embeddedLogo = await pdfDoc.embedPng(logoBytes);
        else if (logoPath.toLowerCase().match(/\.(jpg|jpeg)$/)) embeddedLogo = await pdfDoc.embedJpg(logoBytes);

        if (embeddedLogo) {
          const dims = embeddedLogo.scaleToFit(px(20), px(20));
          page.drawImage(embeddedLogo, {
            x: px(175), y: py(10) - dims.height,
            width: dims.width, height: dims.height,
          });
        }
      }
    } catch (err) { }
  }

  // ── TITLE BAR (Y=35mm, H=14mm) ──
  const ay = result.academic_year || '';
  let ayShort = '';
  if (ay.includes('-')) {
    const [sy, ey] = ay.split('-');
    ayShort = ` - ${sy} - ${ey.slice(-2)}`;
  }
  const titleText = ((result.test_name || 'FITNESS TEST REPORT') + ayShort).toUpperCase();

  page.drawRectangle({
    x: px(15), y: py(35, 14),
    width: px(180), height: px(14),
    color: titleBg
  });
  const titleSize = 14;
  const titleW = fontBold.widthOfTextAtSize(titleText, titleSize);
  const titleX = px(15) + (px(180) - titleW) / 2;
  page.drawText(titleText, {
    x: titleX, y: py(35, 14) + px(14) / 2 - titleSize * 0.35,
    size: titleSize, font: fontBold, color: black
  });

  // ── STUDENT INFO (Y=60mm, Y=70mm) ──
  // Row 1: Student Name | Class
  const r1y = py(60) - 6;
  page.drawText('Student Name:', { x: px(15), y: r1y, size: 10, font: fontBold, color: black });
  page.drawText(result.student_name || '', { x: px(45), y: r1y, size: 10, font: fontReg, color: textDark });

  // Display std conversion
  let displayStd = result.std;
  if (result.std == '-3') displayStd = 'Nursery';
  else if (result.std == '-2') displayStd = 'Jr. KG';
  else if (result.std == '-1') displayStd = 'Sr. KG';

  const classText = `${displayStd} ${result.division}`;
  const classW = fontReg.widthOfTextAtSize(classText, 10);
  const classLabelW = fontBold.widthOfTextAtSize('Class: ', 10);

  page.drawText('Class:', { x: px(195) - classW - classLabelW - px(2), y: r1y, size: 10, font: fontBold, color: black });
  page.drawText(classText, { x: px(195) - classW, y: r1y, size: 10, font: fontReg, color: textDark });

  // Row 2: Assessment (Y=70mm)
  const r2y = py(70) - 6;
  let termDisplay = 'Term 1 & Term 2';
  if (!isMultiTerm) {
    if (result.term === 'term1') termDisplay = 'Term 1';
    else if (result.term === 'term2') termDisplay = 'Term 2';
  }
  page.drawText('Assessment :', { x: px(15), y: r2y, size: 10, font: fontBold, color: black });
  page.drawText(termDisplay, { x: px(45), y: r2y, size: 10, font: fontReg, color: textDark });

  // ── TABLE (Dynamic Y based on Scanner) ──
  const tableY = showScanner ? 85 : 95;
  const headerH = showScanner ? 9 : 12;
  const paramW = 60;
  const rowH = showScanner ? 8 : 11;
  let testW, gradeW, term2W;
  let headers;
  if (isMultiTerm) {
    testW = 75; gradeW = 22; term2W = 22;
    headers = ['Parameters', 'Tests', 'Term 1', 'Term 2'];
  } else {
    testW = 95; gradeW = 25; term2W = 0;
    const showName = selectedTerm === 'term2' ? 'Term 2' : 'Term 1';
    headers = ['Parameters', 'Tests', showName];
  }
  const totalW = paramW + testW + gradeW + term2W;

  // Table header row
  page.drawRectangle({
    x: px(15), y: py(tableY, headerH),
    width: px(totalW), height: px(headerH),
    color: tableHeaderBg
  });
  // Header outer borders
  page.drawLine({ start: { x: px(15), y: py(tableY, headerH) }, end: { x: px(15 + totalW), y: py(tableY, headerH) }, color: blueBorder, thickness: 1.5 }); // Top
  page.drawLine({ start: { x: px(15), y: py(tableY, headerH) }, end: { x: px(15), y: py(tableY) }, color: blueBorder, thickness: 1.5 }); // Left
  page.drawLine({ start: { x: px(15 + totalW), y: py(tableY, headerH) }, end: { x: px(15 + totalW), y: py(tableY) }, color: blueBorder, thickness: 1.5 }); // Right
  page.drawLine({ start: { x: px(15), y: py(tableY) }, end: { x: px(15 + totalW), y: py(tableY) }, color: blueBorder, thickness: 1.5 }); // Bottom

  // Inner Column lines for header
  page.drawLine({ start: { x: px(15 + paramW), y: py(tableY, headerH) }, end: { x: px(15 + paramW), y: py(tableY) }, color: blueBorder, thickness: 1.5 });
  page.drawLine({ start: { x: px(15 + paramW + testW), y: py(tableY, headerH) }, end: { x: px(15 + paramW + testW), y: py(tableY) }, color: blueBorder, thickness: 1.5 });
  if (isMultiTerm) {
    page.drawLine({ start: { x: px(15 + paramW + testW + gradeW), y: py(tableY, headerH) }, end: { x: px(15 + paramW + testW + gradeW), y: py(tableY) }, color: blueBorder, thickness: 1.5 });
  }

  // Header text (Centered)
  const hdrY = py(tableY, headerH) + px(headerH) / 2 - 8 * 0.35;
  page.drawText(headers[0], { x: px(15) + (px(paramW) - fontBold.widthOfTextAtSize(headers[0], 8)) / 2, y: hdrY, size: 8, font: fontBold, color: textDark });
  page.drawText(headers[1], { x: px(15 + paramW) + (px(testW) - fontBold.widthOfTextAtSize(headers[1], 8)) / 2, y: hdrY, size: 8, font: fontBold, color: textDark });
  page.drawText(headers[2], { x: px(15 + paramW + testW) + (px(gradeW) - fontBold.widthOfTextAtSize(headers[2], 8)) / 2, y: hdrY, size: 8, font: fontBold, color: textDark });
  if (isMultiTerm) {
    page.drawText(headers[3], { x: px(15 + paramW + testW + gradeW) + (px(term2W) - fontBold.widthOfTextAtSize(headers[3], 8)) / 2, y: hdrY, size: 8, font: fontBold, color: textDark });
  }

  // ── TABLE ROWS (starting after header) ──
  let yMM = tableY + headerH;

  // For multi-term, fetch term1 and term2 values per parameter
  // Build lookup: paramId → { term1: value, term2: value }
  let termValMap = {};
  if (isMultiTerm) {
    const [t1rows] = await db.query(`
            SELECT ftrv.parameter_id, ftrv.parameter_value
            FROM fitness_test_results ftr
            JOIN fitness_test_result_values ftrv ON ftr.id = ftrv.result_id
            WHERE ftr.student_id = ? AND ftr.format_id = ? AND ftr.term = 'term1'
        `, [result.student_id, result.format_id]);

    const [t2rows] = await db.query(`
            SELECT ftrv.parameter_id, ftrv.parameter_value
            FROM fitness_test_results ftr
            JOIN fitness_test_result_values ftrv ON ftr.id = ftrv.result_id
            WHERE ftr.student_id = ? AND ftr.format_id = ? AND ftr.term = 'term2'
        `, [result.student_id, result.format_id]);

    t1rows.forEach(r => { termValMap[r.parameter_id] = termValMap[r.parameter_id] || {}; termValMap[r.parameter_id].term1 = r.parameter_value; });
    t2rows.forEach(r => { termValMap[r.parameter_id] = termValMap[r.parameter_id] || {}; termValMap[r.parameter_id].term2 = r.parameter_value; });
  }

  // Draw rows
  for (let idx = 0; idx < params.length; idx++) {
    const param = params[idx];

    // For single term, skip params with no value
    const singleVal = param.parameter_value;
    if (!isMultiTerm && (singleVal === null || singleVal === '')) continue;

    // Row background (alternating)
    const bg = idx % 2 === 0 ? rowBg : white;
    page.drawRectangle({
      x: px(15), y: py(yMM, rowH),
      width: px(totalW), height: px(rowH),
      color: bg
    });

    // Left and Right outer borders for row
    page.drawLine({ start: { x: px(15), y: py(yMM, rowH) }, end: { x: px(15), y: py(yMM) }, color: blueBorder, thickness: 1.5 });
    page.drawLine({ start: { x: px(15 + totalW), y: py(yMM, rowH) }, end: { x: px(15 + totalW), y: py(yMM) }, color: blueBorder, thickness: 1.5 });

    // Inner Column borders
    page.drawLine({ start: { x: px(15 + paramW), y: py(yMM, rowH) }, end: { x: px(15 + paramW), y: py(yMM) }, color: blueBorder, thickness: 1.5 });
    page.drawLine({ start: { x: px(15 + paramW + testW), y: py(yMM, rowH) }, end: { x: px(15 + paramW + testW), y: py(yMM) }, color: blueBorder, thickness: 1.5 });
    if (isMultiTerm) {
      page.drawLine({ start: { x: px(15 + paramW + testW + gradeW), y: py(yMM, rowH) }, end: { x: px(15 + paramW + testW + gradeW), y: py(yMM) }, color: blueBorder, thickness: 1.5 });
    }
    // Row bottom border
    page.drawLine({ start: { x: px(15), y: py(yMM) }, end: { x: px(15 + totalW), y: py(yMM) }, color: blueBorder, thickness: 1.5 });

    const rowTextY = py(yMM, rowH) + px(rowH) / 2 - 7 * 0.35;

    // Parameter title (bold, left-aligned)
    const titleStr = (param.title || '').slice(0, 26);
    page.drawText(titleStr, { x: px(15) + 3, y: rowTextY, size: 7.5, font: fontBold, color: textDark });

    // Test description (center, truncated to fit)
    const testText = (param.test_display || param.description || '').slice(0, 42);
    page.drawText(testText, { x: px(15 + paramW) + 3, y: rowTextY, size: 7, font: fontReg, color: textDark });

    // Grade column(s)
    const paramRanges = ranges.filter(r => r.parameter === param.parameter);

    if (!isMultiTerm) {
      // Single: show grade centered in grade column
      const grade = calculateGrade(singleVal, paramRanges);
      const gradeColor = gradeToColor(grade);
      const gw = fontBold.widthOfTextAtSize(grade, 9);
      const gx = px(15 + paramW + testW) + (px(gradeW) - gw) / 2;
      page.drawText(grade, { x: gx, y: rowTextY, size: 9, font: fontBold, color: gradeColor });
    } else {
      // Multi: Term 1 grade
      const tv1 = (termValMap[param.id] || {}).term1;
      const grade1 = calculateGrade(tv1, paramRanges);
      const color1 = gradeToColor(grade1);
      const gw1 = fontBold.widthOfTextAtSize(grade1, 9);
      page.drawText(grade1, { x: px(15 + paramW + testW) + (px(gradeW) - gw1) / 2, y: rowTextY, size: 9, font: fontBold, color: color1 });

      // Multi: Term 2 grade
      const tv2 = (termValMap[param.id] || {}).term2;
      const grade2 = calculateGrade(tv2, paramRanges);
      const color2 = gradeToColor(grade2);
      const gw2 = fontBold.widthOfTextAtSize(grade2, 9);
      page.drawText(grade2, { x: px(15 + paramW + testW + gradeW) + (px(term2W) - gw2) / 2, y: rowTextY, size: 9, font: fontBold, color: color2 });
    }

    yMM += rowH;
  }

  // Draw final closing bottom border for the table
  page.drawLine({
    start: { x: px(15), y: py(yMM) },
    end: { x: px(15 + totalW), y: py(yMM) },
    color: blueBorder,
    thickness: 1.5
  });

  if (params.length === 0) {
    page.drawText('No test parameters found', { x: px(15) + 6, y: py(yMM, rowH) + 3, size: 8, font: fontReg, color: gray });
    yMM += rowH;
  }
  const legendText = 'A+ - Excellent  /  A - Good  /  B+ - Developing  /  B - Needs Improvement';
  const legendSize = 8;
  const legendW = fontBold.widthOfTextAtSize(legendText, legendSize);
  const legendX = px(15) + (px(180) - legendW) / 2;
  const legendYmm = yMM + 10;
  page.drawText(legendText, {
    x: legendX, y: py(legendYmm) - 8,
    size: legendSize, font: fontBold, color: textMed
  });

  // ── FOOTER AREA ──
  let footerY = legendYmm + 10;

  // 1. QR Scanner (If enabled)
  if (showScanner) {
    console.log(`[PDF] Adding QR Code at Y: ${footerY}`);
    await addQRCodeSection(pdfDoc, page, resultId, footerY, {
      px, py, fontBold, fontReg, black, white, gray, width, height
    });
    footerY += 58; // move down after QR box (50mm height + 8mm gap)
  }

  // 2. Signatures (Left & Right) — Forced to bottom if room permits
  const sigLineW = 60; // signature line width in mm
  footerY = Math.max(footerY, 255); // Ensures signatures are at bottom (A4 is 297mm)

  const showHeadCoach = result.show_head_coach_signature !== 0;
  const showPrincipal = result.show_principal_signature !== 0;

  if (showHeadCoach) {
    const startX = 15; // left padding
    const centerX = startX + sigLineW / 2;

    // Image (Top)
    if (result.head_coach_signature_image) {
      try {
        const hcSigPath = path.join(__dirname, 'uploads', result.head_coach_signature_image);
        if (fs.existsSync(hcSigPath)) {
          const hcSigBytes = fs.readFileSync(hcSigPath);
          let hcSigImg;
          if (hcSigPath.toLowerCase().endsWith('.png')) hcSigImg = await pdfDoc.embedPng(hcSigBytes);
          else if (hcSigPath.toLowerCase().match(/\.(jpg|jpeg)$/)) hcSigImg = await pdfDoc.embedJpg(hcSigBytes);
          if (hcSigImg) {
            const dims = hcSigImg.scaleToFit(px(45), px(18));
            page.drawImage(hcSigImg, {
              x: px(centerX) - dims.width / 2,
              y: py(footerY, 18) + (px(18) - dims.height) / 2,
              width: dims.width, height: dims.height
            });
          }
        }
      } catch (e) { }
    }

    // 2. Name (Middle) - WRAPPED
    const hcName = result.head_coach_name || "Head Coach";
    const hcNameLines = wrapText(hcName, px(60), fontReg, 9);
    let hcTextY = footerY + 25;
    for (const line of hcNameLines) {
      const lineW = fontReg.widthOfTextAtSize(line, 9);
      page.drawText(line, { x: px(centerX) - lineW / 2, y: py(hcTextY), size: 9, font: fontReg, color: textMed });
      hcTextY += 4; // 4mm between lines
    }

    // 3. Designation (Bottom, Bold) - WRAPPED
    const hcDesig = result.head_coach_designation || 'Head Coach';
    const hcDesigLines = wrapText(hcDesig, px(60), fontBold, 10);
    for (const line of hcDesigLines) {
      const lineW = fontBold.widthOfTextAtSize(line, 10);
      page.drawText(line, { x: px(centerX) - lineW / 2, y: py(hcTextY + 1), size: 10, font: fontBold, color: black });
      hcTextY += 5;
    }
  }

  if (showPrincipal) {
    const startX = 195 - sigLineW; // 15mm padding from right (210 - 15 - 60)
    const centerX = startX + sigLineW / 2;

    // Image (Top)
    if (result.principal_signature_image) {
      try {
        const pSigPath = path.join(__dirname, 'uploads', result.principal_signature_image);
        if (fs.existsSync(pSigPath)) {
          const pSigBytes = fs.readFileSync(pSigPath);
          let pSigImg;
          if (pSigPath.toLowerCase().endsWith('.png')) pSigImg = await pdfDoc.embedPng(pSigBytes);
          else if (pSigPath.toLowerCase().match(/\.(jpg|jpeg)$/)) pSigImg = await pdfDoc.embedJpg(pSigBytes);
          if (pSigImg) {
            const dims = pSigImg.scaleToFit(px(50), px(18));
            page.drawImage(pSigImg, {
              x: px(centerX) - dims.width / 2,
              y: py(footerY, 18) + (px(18) - dims.height) / 2,
              width: dims.width, height: dims.height
            });
          }
        }
      } catch (e) { }
    }

    // 2. Name (Middle) - WRAPPED
    const pName = result.principal_name || "Principal";
    const pNameLines = wrapText(pName, px(60), fontReg, 9);
    let pTextY = footerY + 25;
    for (const line of pNameLines) {
      const lineW = fontReg.widthOfTextAtSize(line, 9);
      page.drawText(line, { x: px(centerX) - lineW / 2, y: py(pTextY), size: 9, font: fontReg, color: textMed });
      pTextY += 4;
    }

    // 3. Designation (Bottom, Bold) - WRAPPED
    const pDesig = result.principal_designation || 'Principal';
    const pDesigLines = wrapText(pDesig, px(60), fontBold, 10);
    for (const line of pDesigLines) {
      const lineW = fontBold.widthOfTextAtSize(line, 10);
      page.drawText(line, { x: px(centerX) - lineW / 2, y: py(pTextY + 1), size: 10, font: fontBold, color: black });
      pTextY += 5;
    }
  }


  // ── FOOTER (Removed as requested) ──

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// 📄 POST /api/reports/generate-pdf  →  generate & cache PDF for one result_id
app.post('/api/reports/generate-pdf', async (req, res) => {
  const { result_id, options } = req.body;
  if (!result_id) return res.status(400).json({ success: false, message: 'result_id required' });

  try {
    const pdfBytes = await buildReportPDF(result_id, options);
    const filePath = path.join(PDF_TEMP_DIR, `report_${result_id}.pdf`);
    fs.writeFileSync(filePath, pdfBytes);

    // ── Update PDF status in database (Legacy Parity) ──
    try {
      const [[student]] = await db.query(`
        SELECT s.name, s.std, s.division FROM fitness_test_results ftr 
        JOIN students s ON ftr.student_id = s.id WHERE ftr.id = ?
      `, [result_id]);
      const safeName = student ? student.name.replace(/[^a-z0-9]/gi, '_') : 'Result';
      const filename = `Fitness_Test_${safeName}_${result_id}.pdf`;
      await db.query("UPDATE fitness_test_results SET pdf_status = 1, pdf_file_name = ? WHERE id = ?", [filename, result_id]);
    } catch (dbErr) {
      console.warn('[PDF] Failed to update DB status:', dbErr.message);
    }

    res.json({ success: true, filename: `report_${result_id}.pdf` });
  } catch (err) {
    console.error('PDF GEN ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📥 GET /api/reports/download-zip?ids=1,2,3  →  stream ZIP of generated PDFs
app.get('/api/reports/download-zip', (req, res) => {
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ success: false, message: 'ids required' });

  const idList = String(ids).split(',').map(id => id.trim()).filter(Boolean);
  const zipName = `MQ_ReportCards_${Date.now()}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.on('error', err => { console.error('ZIP ERROR:', err); res.status(500).end(); });
  archive.pipe(res);

  let found = 0;
  idList.forEach(id => {
    const filePath = path.join(PDF_TEMP_DIR, `report_${id}.pdf`);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: `report_${id}.pdf` });
      found++;
    }
  });

  if (found === 0) {
    archive.abort();
    return res.status(404).json({ success: false, message: 'No PDFs found. Generate them first.' });
  }

  archive.finalize();
});

// 📥 GET /api/reports/download-single/:result_id  →  download one PDF with potential overrides
app.get('/api/reports/download-single/:result_id', async (req, res) => {
  const { result_id } = req.params;
  const options = req.query.overrides ? JSON.parse(req.query.overrides) : {};

  try {
    console.log(`[PDF] Starting single download for ID: ${result_id}`, options);
    const pdfBytes = await buildReportPDF(result_id, options);
    console.log(`[PDF] Success generating for ID: ${result_id}, size: ${pdfBytes.length}`);

    // ── Update PDF status in database (Legacy Parity) ──
    let filename = `report_${result_id}.pdf`;
    try {
      const [[student]] = await db.query(`
        SELECT s.name, s.std, s.division FROM fitness_test_results ftr 
        JOIN students s ON ftr.student_id = s.id WHERE ftr.id = ?
      `, [result_id]);
      if (student) {
        const safeName = student.name.replace(/[^a-z0-9]/gi, '_');
        filename = `Fitness_Test_${safeName}_Std${student.std}_${student.division}.pdf`;
      }
      await db.query("UPDATE fitness_test_results SET pdf_status = 1, pdf_file_name = ? WHERE id = ?", [filename, result_id]);
    } catch (dbErr) {
      console.warn('[PDF] Failed to update DB status:', dbErr.message);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Single Download Error:', err);
    // Send 500 but as text so the user can see the error message in the browser if it fails
    res.status(500).send(`Error generating PDF: ${err.message}\n\nStack: ${err.stack}`);
  }
});

// 🎓 HELPERS for ID Generation
function incrementStringId(id) {
  if (!id) return '';
  const match = id.match(/^(.*?)(\d+)$/);
  if (!match) return id + '1';
  const prefix = match[1];
  const number = parseInt(match[2]);
  return prefix + (number + 1);
}

// 🎓 GET NEXT STUDENT IDs (FOR AUTO-FILL)
app.get('/api/students/next-ids', async (req, res) => {
  try {
    const [[lastStudent]] = await db.query('SELECT mq_id, roll_number FROM students ORDER BY id DESC LIMIT 1');

    let nextMqId = 'MQ-101';
    let nextRollNumber = '1';

    if (lastStudent) {
      if (lastStudent.mq_id) nextMqId = incrementStringId(lastStudent.mq_id);
      if (lastStudent.roll_number) {
        const rollMatch = lastStudent.roll_number.match(/\d+/);
        if (rollMatch) {
          nextRollNumber = (parseInt(rollMatch[0]) + 1).toString();
        } else {
          nextRollNumber = lastStudent.roll_number + '1';
        }
      }
    }

    res.json({ success: true, nextMqId, nextRollNumber });
  } catch (err) {
    console.error('GET NEXT IDs ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🎓 BULK STUDENT UPLOAD (Auto-ID Enabled)
app.post('/api/students/bulk', async (req, res) => {
  const { students } = req.body;
  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ success: false, message: 'Invalid student data' });
  }

  try {
    const results = { imported: 0, failed: 0, errors: [] };

    // 1. Fetch the latest state once to start incrementing
    const [[lastInfo]] = await db.query('SELECT mq_id, roll_number FROM students ORDER BY id DESC LIMIT 1');
    let trackerMqId = lastInfo?.mq_id || 'MQ-100';
    let trackerRoll = parseInt(lastInfo?.roll_number?.match(/\d+/)?.[0] || '0');

    for (const student of students) {
      try {
        let { name, gender, school_id, std, division, roll_number, mq_id } = student;

        // Basic validation
        if (!name || !school_id || !std || !division) {
          results.failed++;
          results.errors.push(`Missing data for: ${name || 'Unknown'}`);
          continue;
        }

        // 2. Auto-generate MQ ID if missing
        if (!mq_id || mq_id === '') {
          trackerMqId = incrementStringId(trackerMqId);
          mq_id = trackerMqId;
        }

        // 3. Auto-generate Roll Number if missing
        if (!roll_number || roll_number === '') {
          trackerRoll++;
          roll_number = trackerRoll.toString();
        }

        const [existing] = await db.query('SELECT id FROM students WHERE mq_id = ? AND mq_id IS NOT NULL', [mq_id]);
        if (existing.length > 0) {
          results.failed++;
          results.errors.push(`Student with MQ ID ${mq_id} already exists`);
          continue;
        }

        await db.query(`
          INSERT INTO students (name, gender, school_id, std, division, roll_number, mq_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [name, gender || 'Male', school_id, std, division, roll_number, mq_id]);

        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push(err.message);
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 📦 STOCK & EQUIPMENT ORDER APIS
// ============================================================

// 📦 GET EQUIPMENT ORDERS
app.get('/api/equipment-orders', async (req, res) => {
  const user_id = req.query.user_id || null;
  const role_id = parseInt(req.query.role_id) || 0;
  try {
    let query = `
      SELECT eo.*, s.name as school_name, u.name as user_name
      FROM equipment_order eo
      LEFT JOIN schools s ON s.id = eo.school_id
      LEFT JOIN users u ON eo.user_id = u.id
    `;
    let params = [];

    if (role_id === 1 || role_id === 7) {
      // Admin sees only SSGM-approved orders
      query += ' WHERE eo.approve_ssgm = 1';
    } else if (role_id === 3) {
      // SSGM sees all orders
      query += ' WHERE 1=1';
    } else {
      // Regular users see only their own requests
      query += ' WHERE eo.user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY eo.created_at DESC';
    const [rows] = await db.query(query, params);

    const processedOrders = rows.map(row => {
      let status = 'Pending Approval';
      if (row.approve_ssgm === 1) {
        status = 'SSGM Verified';
        if (row.approve_admin === 1) {
          status = 'Admin Approved';
          if (row.status_delivery === 'Processing') status = 'Processing';
          else if (row.status_delivery === 'Delivered') status = 'Delivered';
        } else if (row.approve_admin === 0) {
          status = 'Rejected';
        }
      } else if (row.approve_ssgm === 0) {
        status = 'Rejected';
      }
      return { ...row, status };
    });

    res.json({ success: true, data: processedOrders });
  } catch (err) {
    console.error('GET EQUIPMENT ORDERS ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📦 CREATE EQUIPMENT ORDER (with optional image upload)
app.post('/api/equipment-orders', upload.single('image'), async (req, res) => {
  const { school_id, items, user_id } = req.body;
  const image_path = req.file ? `uploads/${req.file.filename}` : null;

  try {
    if (!school_id) {
      return res.status(400).json({ success: false, message: 'School is required.' });
    }

    const parsedItems = typeof items === 'string' ? JSON.parse(items) : (items || []);
    let successCount = 0;

    for (const item of parsedItems) {
      if (item.sku_name && item.sku_name.trim() !== '') {
        await db.query(
          'INSERT INTO equipment_order (sku_name, qty, school_id, size, user_id, image_path) VALUES (?, ?, ?, ?, ?, ?)',
          [item.sku_name, item.qty || 0, school_id, item.size || '', user_id, image_path]
        );
        successCount++;
      }
    }

    // If no valid items but an image was uploaded, insert a placeholder row
    if (successCount === 0 && image_path) {
      await db.query(
        'INSERT INTO equipment_order (sku_name, qty, school_id, size, user_id, image_path) VALUES (?, ?, ?, ?, ?, ?)',
        ['Check Image', 0, school_id, '', user_id, image_path]
      );
    } else if (successCount === 0) {
      return res.status(400).json({ success: false, message: 'Provide at least one equipment item or an image.' });
    }

    res.json({ success: true, message: 'Equipment order placed successfully!' });
  } catch (err) {
    console.error('CREATE EQUIPMENT ORDER ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📦 UPDATE EQUIPMENT ORDER STATUS (Approve / Reject)
app.put('/api/equipment-orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, role_id } = req.body;

  try {
    let updateField = '';
    let value = 0;

    const s = (status || '').toLowerCase();
    if (s === 'approved') value = 1;
    else if (s === 'rejected') value = 0;
    else return res.status(400).json({ success: false, message: 'Invalid status. Use "approved" or "rejected".' });

    if (role_id === 3) {
      updateField = 'approve_ssgm';
    } else if (role_id === 1 || role_id === 7) {
      updateField = 'approve_admin';
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized to update order status.' });
    }

    await db.query(`UPDATE equipment_order SET ${updateField} = ? WHERE id = ?`, [value, id]);
    res.json({ success: true, message: 'Order status updated successfully.' });
  } catch (err) {
    console.error('UPDATE ORDER STATUS ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 📄 STOCK REPORT APIS
// ============================================================

// 📄 GET STOCK REPORTS (with optional month/date filter)
app.get('/api/stock-reports', async (req, res) => {
  const { month, date } = req.query;

  try {
    let query = `
      SELECT sr.*, s.name as school_name
      FROM stock_reports sr
      LEFT JOIN schools s ON s.id = sr.school_id
      WHERE 1=1
    `;
    const params = [];

    if (month) {
      query += ' AND MONTH(sr.report_date) = ?';
      params.push(month);
    }
    if (date) {
      query += ' AND DATE(sr.report_date) = ?';
      params.push(date);
    }

    query += ' ORDER BY sr.report_date DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET STOCK REPORTS ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📄 ADD STOCK REPORT (with file upload)
app.post('/api/stock-reports', upload.single('file_main'), async (req, res) => {
  const { school_id, report_date, role_id } = req.body;
  const file_path = req.file ? `uploads/${req.file.filename}` : null;

  try {
    if (!school_id || !file_path) {
      return res.status(400).json({ success: false, message: 'School and file are required.' });
    }

    await db.query(
      'INSERT INTO stock_reports (school_id, report_date, file_path, excel_path, role_id) VALUES (?, ?, ?, ?, ?)',
      [school_id, report_date || new Date().toISOString().split('T')[0], file_path, '', role_id || 0]
    );

    res.json({ success: true, message: 'Stock report added successfully!' });
  } catch (err) {
    console.error('ADD STOCK REPORT ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


app.get('/api/curriculums', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id_indicate_curriculum, 
        sport, 
        COUNT(*) as module_count, 
        MAX(created_at) as created_at 
      FROM year_lp_master 
      GROUP BY id_indicate_curriculum, sport 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, curriculums: rows });
  } catch (err) {
    console.error('FETCH CURRICULUMS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching curriculums' });
  }
});

// 🗑️ DELETE CURRICULUM MASTER
app.delete('/api/curriculums/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // First remove assignments linked to this curriculum
    await db.query('DELETE FROM sport_lp_assign WHERE id_indicate_curriculum = ?', [id]);
    // Then remove the curriculum itself
    await db.query('DELETE FROM year_lp_master WHERE id_indicate_curriculum = ?', [id]);
    
    res.json({ success: true, message: 'Curriculum and its assignments removed successfully!' });
  } catch (err) {
    console.error('DELETE CURRICULUM ERROR:', err);
    res.status(500).json({ success: false, message: 'Error removing curriculum' });
  }
});

// 🎯 ASSIGN CURRICULUM
app.post('/api/curriculum/assign', async (req, res) => {
  try {
    const teacher_id = parseInt(req.body.teacher_id, 10);
    const assignments_json = req.body.assignments || '[]';
    const assignments = JSON.parse(assignments_json);

    if (teacher_id && assignments.length > 0) {
      for (const assignment of assignments) {
        const sport = assignment.sport;
        const curriculum_id = parseInt(assignment.curriculum_id, 10);

        const [check] = await db.query(
          'SELECT id FROM sport_lp_assign WHERE user_id = ? AND sport = ?',
          [teacher_id, sport]
        );

        if (check.length === 0) {
          await db.query(
            'INSERT INTO sport_lp_assign (user_id, sport, id_indicate_curriculum) VALUES (?, ?, ?)',
            [teacher_id, sport, curriculum_id]
          );
        }
      }
      res.json({ success: true, message: 'Assignment successful!' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid data.' });
    }
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🎯 GET ALL ASSIGNMENTS FOR A SPECIFIC COACH (SUMMARY)
app.get('/api/curriculum/my-assignments/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let [rows] = await db.query(`
      SELECT 
        sla.id, 
        sla.sport, 
        sla.id_indicate_curriculum,
        (SELECT COUNT(*) FROM year_lp_master ylm WHERE ylm.id_indicate_curriculum = sla.id_indicate_curriculum) as module_count,
        MAX(sla.created_at) as created_at
      FROM sport_lp_assign sla
      WHERE sla.user_id = ?
      GROUP BY sla.id, sla.sport, sla.id_indicate_curriculum
      ORDER BY created_at DESC
    `, [userId]);

    // 🚀 SUPER ADMIN BYPASS: If Admin (1) has no assignments, show all unique curriculums
    if (rows.length === 0 && userId == '1') {
      console.log('[DEBUG] Admin bypass triggered for Summary');
      [rows] = await db.query(`
        SELECT 
          MIN(id) as id, 
          sport, 
          id_indicate_curriculum, 
          COUNT(*) as module_count, 
          MAX(created_at) as created_at 
        FROM year_lp_master 
        GROUP BY id_indicate_curriculum, sport
      `);
    }

    res.json({ success: true, assignments: rows });
  } catch (err) {
    console.error('FETCH MY ASSIGNMENTS ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error fetching assignments' });
  }
});

// 🎯 GET ALL MODULES FOR A SPECIFIC CURRICULUM
app.get('/api/curriculum/modules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        id, 
        grade, 
        module_name, 
        lesson_details, 
        created_at 
      FROM year_lp_master 
      WHERE id_indicate_curriculum = ?
      ORDER BY id ASC
    `, [id]);
    res.json({ success: true, modules: rows });
  } catch (err) {
    console.error('FETCH MODULES ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching module details' });
  }
});

// 🎯 GET ALL LESSON MODULES FOR A SPECIFIC COACH (FULL LIST - PHP REFERENCE LOGIC)
app.get('/api/curriculum/my-modules/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let [rows] = await db.query(`
      SELECT 
        ylm.id as module_id, 
        ylm.sport, 
        ylm.grade, 
        ylm.skill,
        ylm.sub_skill,
        ylm.objective,
        ylm.lp_no,
        ylm.created_at as module_date
      FROM year_lp_master ylm
      WHERE ylm.id_indicate_curriculum IN (
        SELECT id_indicate_curriculum FROM sport_lp_assign WHERE user_id = ?
      )
      ORDER BY ylm.sport, ylm.grade, ylm.lp_no, ylm.id
    `, [userId]);

    // 🚀 SUPER ADMIN BYPASS: If Admin (1) has no assignments, show all modules
    if (rows.length === 0 && userId == '1') {
      console.log('[DEBUG] Admin bypass triggered for Modules');
      [rows] = await db.query(`
        SELECT 
          id as module_id, sport, grade, skill, sub_skill, objective, lp_no, created_at as module_date 
        FROM year_lp_master 
        ORDER BY sport, grade, lp_no
        LIMIT 500
      `);
    }

    res.json({ success: true, modules: rows });
  } catch (err) {
    console.error('FETCH MY MODULES ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error fetching lesson modules' });
  }
});

// 📋 GET ALL ASSIGNMENTS
app.get('/api/curriculum/assignments', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        sla.id, 
        sla.sport, 
        sla.user_id, 
        sla.id_indicate_curriculum,
        u.name as coach_name,
        (SELECT COUNT(*) FROM year_lp_master ylm WHERE ylm.id_indicate_curriculum = sla.id_indicate_curriculum) as module_count
      FROM sport_lp_assign sla
      JOIN users u ON sla.user_id = u.id
      ORDER BY sla.id DESC
    `);
    res.json({ success: true, assignments: rows });
  } catch (err) {
    console.error('FETCH ASSIGNMENTS ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching assignments' });
  }
});

// 🎯 GET ALL AVAILABLE COACHES (ROLE_ID = 4)
app.get('/api/curriculum/coaches', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM users WHERE role_id = 4 ORDER BY name ASC');
    res.json({ success: true, coaches: rows });
  } catch (err) {
    console.error('FETCH COACHES ERROR:', err);
    res.status(500).json({ success: false, message: 'Error fetching coaches' });
  }
});

// 🎯 BATCH ASSIGN LESSON PLANS TO A COACH (PHP REFERENCE LOGIC)
app.post('/api/curriculum/assign-batch', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { teacher_id, week, month_year, assignments, assigned_by } = req.body;

    if (!teacher_id || !week || !month_year || !assignments || !assignments.length) {
      return res.status(400).json({ success: false, message: 'Invalid assignment data' });
    }

    await connection.beginTransaction();
    let assignedCount = 0;
    let duplicateCount = 0;

    for (const assign of assignments) {
      const curriculumId = assign.curriculum_id;

      // 1. Check for duplicates (PHP logic)
      const [existing] = await connection.query(`
        SELECT id FROM assigned_lesson_plans 
        WHERE curriculum_id = ? AND assigned_to = ? AND week = ? AND month_year = ?
      `, [curriculumId, teacher_id, week, month_year]);

      if (existing.length > 0) {
        duplicateCount++;
        continue;
      }

      // 2. Fetch full details from master (PHP logic)
      const [lpData] = await connection.query('SELECT * FROM year_lp_master WHERE id = ?', [curriculumId]);
      
      if (lpData.length === 0) continue;
      const lp = lpData[0];

      // 3. Insert into assignments table
      await connection.query(`
        INSERT INTO assigned_lesson_plans (
          lp_no, sport, skill, sub_skill, objective, teaching_aids, warm_up, 
          skill_implementation, picture, cool_down, summarization, life_skill, 
          grade, lp_unique_id, curriculum_id, week, month_year, 
          assigned_to, assigned_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        lp.lp_no, lp.sport, lp.skill, lp.sub_skill, lp.objective, lp.teaching_aids, lp.warm_up,
        lp.skill_implementation, lp.picture, lp.cool_down, lp.summarization, lp.life_skill,
        lp.grade, lp.lp_unique_id, curriculumId, week, month_year, 
        teacher_id, assigned_by
      ]);

      assignedCount++;
    }

    await connection.commit();
    res.json({ 
      success: true, 
      message: `Assigned ${assignedCount} plans successfully. ${duplicateCount > 0 ? `(${duplicateCount} were already assigned)` : ''}` 
    });

  } catch (err) {
    await connection.rollback();
    console.error('BATCH ASSIGN ERROR:', err);
    res.status(500).json({ success: false, message: 'Server error during batch assignment' });
  } finally {
    connection.release();
  }
});

// 🗑️ DELETE ASSIGNMENT
app.delete('/api/curriculum/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM sport_lp_assign WHERE id = ?', [id]);
    res.json({ success: true, message: 'Assignment removed successfully!' });
  } catch (err) {
    console.error('DELETE ASSIGNMENT ERROR:', err);
    res.status(500).json({ success: false, message: 'Error removing assignment' });
  }
});

// 🏆 IMPORT EXCEL CURRICULUM
app.post('/api/curriculum/import', upload.single('file_name'), async (req, res) => {
  const { sport_name } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'Please upload an Excel file.' });
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.xlsx', '.xls'].includes(ext)) {
    // Clean up uploaded file
    fs.unlinkSync(file.path);
    return res.status(400).json({ success: false, message: 'Only Excel files allowed!' });
  }

  try {
    const [[lastRow]] = await db.query('SELECT MAX(id_indicate_curriculum) as last_id FROM year_lp_master');
    const id_indicate_curriculum = (lastRow && lastRow.last_id ? lastRow.last_id : 0) + 1;

    const workbook = xlsx.readFile(file.path);
    let inserted = 0;

    for (const sheetName of workbook.SheetNames) {
      const gradeMatch = sheetName.match(/\d+/);
      if (!gradeMatch) continue;
      const grade = parseInt(gradeMatch[0], 10);
      if (grade <= 0) continue;

      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length <= 1) continue;
      rows.shift(); // remove header

      for (const r of rows) {
        const lp_no = String(r[0] || '').trim();
        if (!lp_no) continue;

        const skill = String(r[1] || '').trim();
        const sub_skill = String(r[2] || '').trim();
        const objective = String(r[3] || '').trim();
        const teaching_aids = String(r[4] || '').trim();
        const warm_up = String(r[5] || '').trim();
        const skill_implementation = String(r[6] || '').trim();
        const picture = String(r[7] || '').trim();
        const cool_down = String(r[8] || '').trim();
        const summarization = String(r[9] || '').trim();
        const life_skill = String(r[10] || '').trim();

        const uniqueParams = crypto.randomBytes(8).toString('hex');

        await db.query(`
          INSERT INTO year_lp_master 
          (grade, sport, lp_no, skill, sub_skill, objective, teaching_aids, warm_up, 
           skill_implementation, picture, cool_down, summarization, life_skill, created_at, 
           lp_unique_id, id_indicate_curriculum) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
          grade, sport_name || '', lp_no, skill, sub_skill, objective, teaching_aids,
          warm_up, skill_implementation, picture, cool_down, summarization, life_skill,
          uniqueParams, id_indicate_curriculum
        ]);

        inserted++;
      }
    }

    res.json({ success: true, message: `Excel Imported Successfully! Curriculum ID: ${id_indicate_curriculum} | Total Rows Inserted: ${inserted}` });

  } catch (err) {
    console.error('IMPORT CURRICULUM ERROR:', err);
    res.status(500).json({ success: false, message: 'Error: ' + err.message });
  } finally {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});