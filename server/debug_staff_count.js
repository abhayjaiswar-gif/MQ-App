const db = require('./db');

async function debugStats() {
  try {
    const [roles] = await db.query('SELECT * FROM roles');
    console.log('--- ROLES ---');
    console.table(roles);

    const [coaches] = await db.query('SELECT COUNT(*) as count FROM users WHERE role_id IN (4, 5)');
    console.log('--- GLOBAL COACHES (Role 4, 5) ---');
    console.log(coaches[0].count);

    const [assignments] = await db.query('SELECT * FROM assign_school LIMIT 10');
    console.log('--- ASSIGN_SCHOOL SAMPLE ---');
    console.table(assignments);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugStats();
