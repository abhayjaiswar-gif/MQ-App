const mysql = require('mysql2/promise');
require('dotenv').config();

async function findTablesWithSchoolId() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'appmarcos_mainapp'
  });

  const [tables] = await connection.query('SHOW TABLES');
  const tableNames = tables.map(row => Object.values(row)[0]);
  
  const results = [];
  for (const table of tableNames) {
    try {
      const [columns] = await connection.query(`DESCRIBE ${table}`);
      if (columns.some(col => col.Field === 'school_id')) {
        results.push(table);
      }
    } catch (e) {}
  }

  console.log('Tables with school_id:', results);
  process.exit();
}

findTablesWithSchoolId().catch(err => {
  console.error(err);
  process.exit(1);
});
