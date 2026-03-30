const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mq_db'
  });

  try {
    const [columns] = await connection.query('DESCRIBE students');
    console.log('COLUMNS:', columns.map(c => c.Field));

    const [sample] = await connection.query('SELECT * FROM students LIMIT 1');
    console.log('SAMPLE:', sample);
    
    // Check for specific school/std/division
    const [counts] = await connection.query('SELECT school_id, std, division, COUNT(*) as count FROM students GROUP BY school_id, std, division LIMIT 10');
    console.log('GROUPS:', counts);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
