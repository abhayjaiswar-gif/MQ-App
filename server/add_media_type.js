const mysql = require('mysql2/promise');
const dbConfig = { host: 'localhost', user: 'root', password: '', database: 'appmarcos_mainapp' };

(async () => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.query("ALTER TABLE dashboard_highlights ADD COLUMN IF NOT EXISTS media_type ENUM('image','video') DEFAULT 'image'");
    console.log('media_type column added successfully');
    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
