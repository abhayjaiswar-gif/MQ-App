const mysql = require('mysql2/promise');
const path = require('path');

async function debugData() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'edu_sport' // assuming this is the DB name based on context
  });

  try {
    console.log('--- Assigned Lesson Plans ---');
    const [alp] = await db.query('SELECT month_year, week FROM assigned_lesson_plans LIMIT 5');
    console.table(alp);

    console.log('--- LP Assign ---');
    const [la] = await db.query("SELECT DATE_FORMAT(assign_date, '%b, %Y') as formatted, week_no FROM lp_assign LIMIT 5");
    console.table(la);

    console.log('--- Master New ---');
    const [yn] = await db.query('SELECT month_year, week FROM year_lp_master_new LIMIT 5');
    console.table(yn);

  } catch (err) {
    console.error('Debug Error:', err.message);
  } finally {
    await db.end();
  }
}

debugData();
