const mysql = require('mysql2/promise');
require('dotenv').config();

async function describeTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'appmarcos_mainapp'
  });

  const [columns] = await connection.query('DESCRIBE students');
  columns.forEach(col => console.log(col.Field));
  process.exit();
}

describeTable().catch(err => {
  console.error(err);
  process.exit(1);
});
