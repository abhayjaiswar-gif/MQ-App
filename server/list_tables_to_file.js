const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function listTablesToFile() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'appmarcos_mainapp'
  });

  const [tables] = await connection.query('SHOW TABLES');
  const tableNames = tables.map(row => Object.values(row)[0]);
  fs.writeFileSync('tables.txt', tableNames.join('\n'));
  console.log('Tables written to tables.txt');
  process.exit();
}

listTablesToFile().catch(err => {
  console.error(err);
  process.exit(1);
});
