const mysql = require('mysql2/promise');
require('dotenv').config();

async function explore() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mq_new'
  });

  const tables = ['fitness_test_results', 'fitness_test_result_values', 'parameter_info', 'fitness_test_formats'];
  
  for (const table of tables) {
    console.log(`--- ${table} ---`);
    const [rows] = await connection.query(`DESC ${table}`);
    console.table(rows);
  }

  await connection.end();
}

explore();
