const db = require('./db');
async function run() {
  const [tables] = await db.query("SHOW TABLES LIKE '%calendar%'");
  console.log(tables);
  const [evtTables] = await db.query("SHOW TABLES LIKE '%event%'");
  console.log(evtTables);
  process.exit(0);
}
run();
