const db = require('./server/db');

async function inspectSchema() {
  try {
    console.log('--- year_lp_master ---');
    const [cols1] = await db.query('DESCRIBE year_lp_master');
    console.table(cols1);

    console.log('\n--- sport_lp_assign ---');
    const [cols2] = await db.query('DESCRIBE sport_lp_assign');
    console.table(cols2);

    console.log('\n--- curriculums (if exists) ---');
    try {
      const [cols3] = await db.query('DESCRIBE curriculums');
      console.table(cols3);
    } catch (e) { console.log('curriculums table not found'); }

  } catch (err) {
    console.error('Inspection failed:', err);
  } finally {
    process.exit();
  }
}

inspectSchema();
