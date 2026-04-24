const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'appmarcos_mainapp'
};

async function setupFeedbackTable() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database.');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS feed_back_user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255),
        email VARCHAR(255),
        subject VARCHAR(255),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table "feed_back_user" created successfully.');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

setupFeedbackTable();
