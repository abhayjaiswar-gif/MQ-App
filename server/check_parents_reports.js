const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'appmarcos_mainapp'
  });

  try {
    const [columns] = await connection.query('DESCRIBE mq_report_parents');
    console.log('COLUMNS_START');
    columns.forEach(col => console.log(col.Field));
    console.log('COLUMNS_END');
  } catch (err) {
    console.error('Table mq_report_parents does not exist or error:', err.message);
  }
  process.exit();
}

checkTable().catch(err => {
  console.error(err);
  process.exit(1);
});
