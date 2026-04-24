require('dotenv').config();
const db = require('./db');

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ptm_user_unlocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      unlocked_by INT NOT NULL,
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ptm_event_id INT DEFAULT NULL,
      UNIQUE KEY unique_user_unlock (user_id)
    )
  `);
  console.log('✅ ptm_user_unlocks table created/verified');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
