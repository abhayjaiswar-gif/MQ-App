const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'appmarcos_mainapp'
  });

  try {
    const [rows] = await db.query('SELECT *, DATE_FORMAT(lecture_date, "%b, %Y") as formatted_month, CONCAT("Week ", (FLOOR((DAY(lecture_date) - 1) / 7) + 1)) as calc_week FROM marked_lectures LIMIT 10');
    console.log('Sample Marked Lectures:', JSON.stringify(rows, null, 2));
    
    const [count] = await db.query('SELECT COUNT(*) as total FROM marked_lectures');
    console.log('Total Marked Lectures:', count[0].total);

    const [schools] = await db.query('SELECT id, name FROM schools LIMIT 5');
    console.log('Sample Schools:', schools);

  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

checkData();
