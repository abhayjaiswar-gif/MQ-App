const db = require('./db');

async function inspect() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('ALL TABLES:', tableNames.join(', '));
    
    for (const table of tableNames) {
      if (table.includes('stock') || table.includes('request') || table.includes('order') || table.includes('report')) {
        const [columns] = await db.query(`DESCRIBE ${table}`);
        console.log(`\nSCHEMA FOR ${table}:`, columns.map(c => `${c.Field} (${c.Type})`).join(', '));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

inspect();
