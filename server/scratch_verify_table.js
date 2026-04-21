const db = require('./db');

async function checkTable() {
  try {
    const [rows] = await db.query("SHOW TABLES LIKE 'support_tickets'");
    if (rows.length > 0) {
      console.log('✅ Table support_tickets exists.');
      const [columns] = await db.query("DESCRIBE support_tickets");
      console.log('Columns:', JSON.stringify(columns, null, 2));
    } else {
      console.log('❌ Table support_tickets does NOT exist.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error checking table:', err);
    process.exit(1);
  }
}

checkTable();
