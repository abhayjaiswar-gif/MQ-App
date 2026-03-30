const db = require('./db');

async function check() {
  try {
    const [columns] = await db.query('DESCRIBE students');
    console.log('COLUMNS:', columns.map(c => c.Field));

    const [sample] = await db.query('SELECT * FROM students LIMIT 1');
    console.log('SAMPLE:', sample[0]);
    
    const [counts] = await db.query('SELECT school_id, std, division, status, COUNT(*) as count FROM students GROUP BY school_id, std, division, status LIMIT 30');
    console.log('GROUPS:', JSON.stringify(counts, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
