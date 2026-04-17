const db = require('./db');
(async () => {
  try {
    const [rows] = await db.query(`
      SELECT school_id, week, month_year, school_able_to_visibale_status, COUNT(*) as count 
      FROM year_lp_master_new 
      GROUP BY school_id, week, month_year, school_able_to_visibale_status
      LIMIT 10
    `);
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
