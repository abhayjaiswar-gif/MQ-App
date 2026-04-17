const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' }); // Assuming there's a .env file

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mq_app_db' // fallback db name or find from server/index.js
    });
    
    // Instead of guessing, let's just grep the actual DB config from server/index.js!
  } catch (err) {
    console.error(err);
  }
}
run();
