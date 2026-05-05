const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS sggm_mom (
      id INT(11) NOT NULL AUTO_INCREMENT,
      school_id INT(11) DEFAULT NULL,
      user_id INT(11) DEFAULT NULL,
      school_name VARCHAR(255) DEFAULT NULL,
      person_met VARCHAR(255) DEFAULT NULL,
      meeting_concerns TEXT DEFAULT NULL,
      coach_concerns TEXT DEFAULT NULL,
      consensus TEXT DEFAULT NULL,
      mom_summary TEXT DEFAULT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `;

  try {
    await db.query(sql);
    console.log('Table sggm_mom created successfully.');
  } catch (err) {
    console.error('Error creating table:', err);
  }
  process.exit(0);
}

run();
