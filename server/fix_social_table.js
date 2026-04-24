const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'appmarcos_mainapp'
};

async function fixSocialTable() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    // Ensure the table exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS dashboard_social_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active TINYINT(1) DEFAULT 1
      )
    `);

    // Check current columns
    const [cols] = await conn.query("SHOW COLUMNS FROM dashboard_social_content");
    const colNames = cols.map(c => c.Field);
    console.log('Current columns:', colNames);

    // List of columns to check and add
    const requiredColumns = [
      { name: 'content_type', query: "ALTER TABLE dashboard_social_content ADD COLUMN content_type VARCHAR(50) DEFAULT 'video'" },
      { name: 'title', query: "ALTER TABLE dashboard_social_content ADD COLUMN title VARCHAR(255)" },
      { name: 'url', query: "ALTER TABLE dashboard_social_content ADD COLUMN url VARCHAR(255)" },
      { name: 'thumbnail_url', query: "ALTER TABLE dashboard_social_content ADD COLUMN thumbnail_url VARCHAR(255)" },
      { name: 'video_path', query: "ALTER TABLE dashboard_social_content ADD COLUMN video_path VARCHAR(255)" },
      { name: 'school_id', query: "ALTER TABLE dashboard_social_content ADD COLUMN school_id INT NULL DEFAULT NULL" },
      { name: 'is_active', query: "ALTER TABLE dashboard_social_content ADD COLUMN is_active TINYINT(1) DEFAULT 1" }
    ];

    for (const col of requiredColumns) {
      if (!colNames.includes(col.name)) {
        await conn.query(col.query);
        console.log(`✅ Added '${col.name}' column.`);
      } else {
        console.log(`ℹ️  '${col.name}' column already exists.`);
      }
    }

    // Verify final columns
    const [finalCols] = await conn.query("SHOW COLUMNS FROM dashboard_social_content");
    console.log('\n🎯 Final table structure:');
    finalCols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

    console.log('\n🚀 Social Content Table Fix complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

fixSocialTable();
