const mysql = require('mysql2/promise');
require('dotenv').config();

async function listTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'appmarcos_mainapp'
  });

  const [rows] = await connection.query('SHOW TABLES');
  const names = rows.map(row => Object.values(row)[0]).sort();
  console.log('--- ALL TABLES START ---');
  names.forEach(name => console.log(name));
  console.log('--- ALL TABLES END ---');
  process.exit();
}

listTables().catch(err => {
  console.error(err);
  process.exit(1);
});
