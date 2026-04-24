const mysql = require('mysql2/promise');
require('dotenv').config();
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'appmarcos_mainapp'
};

async function fix() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    // Check current columns
    const [cols] = await conn.query("SHOW COLUMNS FROM dashboard_events");
    const colNames = cols.map(c => c.Field);
    console.log('Current columns:', colNames);

    // Add 'category' if missing
    if (!colNames.includes('category')) {
      await conn.query(`ALTER TABLE dashboard_events ADD COLUMN category ENUM('Sports', 'Academic', 'Event') DEFAULT 'Event' AFTER event_date`);
      console.log("✅ Added 'category' column.");
    } else {
      console.log("ℹ️  'category' column already exists.");
    }
    
    if (!colNames.includes('is_featured')) {
      await conn.query(`ALTER TABLE dashboard_events ADD COLUMN is_featured TINYINT DEFAULT 0 AFTER category`);
      console.log("✅ Added 'is_featured' column.");
    } else {
      console.log("ℹ️  'is_featured' column already exists.");
    }

    // Add 'school_id' if missing
    if (!colNames.includes('school_id')) {
      await conn.query(`ALTER TABLE dashboard_events ADD COLUMN school_id INT NULL DEFAULT NULL AFTER is_featured`);
      console.log("✅ Added 'school_id' column.");
    } else {
      console.log("ℹ️  'school_id' column already exists.");
    }

    // Verify final columns
    const [finalCols] = await conn.query("SHOW COLUMNS FROM dashboard_events");
    console.log('\n🎯 Final table structure:');
    finalCols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

    console.log('\n🚀 Fix complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

fix();
