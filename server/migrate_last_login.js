const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'appmarcos_mainapp'
};

async function migrate() {
  const conn = await mysql.createConnection(dbConfig);
  try {
    const [cols] = await conn.query("SHOW COLUMNS FROM users LIKE 'last_login'");
    if (cols.length === 0) {
      await conn.query("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL");
      console.log("✅ Added last_login column to users table.");
    } else {
      console.log("ℹ️ last_login column already exists.");
    }
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await conn.end();
  }
}

migrate();
