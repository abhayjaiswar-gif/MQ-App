const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'appmarcos_mainapp'
};

async function fixHighlightsTable() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    // Check current columns
    const [cols] = await conn.query("SHOW COLUMNS FROM dashboard_highlights");
    const colNames = cols.map(c => c.Field);
    console.log('Current columns:', colNames);

    // Add 'school_id' if missing
    if (!colNames.includes('school_id')) {
      await conn.query(`ALTER TABLE dashboard_highlights ADD COLUMN school_id INT NULL DEFAULT NULL`);
      console.log("✅ Added 'school_id' column.");
    }

    // Add 'reel_url' if missing
    if (!colNames.includes('reel_url')) {
      await conn.query(`ALTER TABLE dashboard_highlights ADD COLUMN reel_url VARCHAR(255) NULL DEFAULT NULL`);
      console.log("✅ Added 'reel_url' column.");
    }

    // Verify final columns
    const [finalCols] = await conn.query("SHOW COLUMNS FROM dashboard_highlights");
    console.log('\n🎯 Final table structure:');
    finalCols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

    console.log('\n🚀 Fix complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

fixHighlightsTable();
