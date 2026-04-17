const db = require('./db');
(async () => {
  try {
    const school_id = 43;
    const week_no = 'Week 1';
    const month_year = 'Mar,2026'; // Standardized format (no space) match the frontend logic

    const sql = `
      UPDATE year_lp_master_new 
      SET school_able_to_visibale_status = 1 
      WHERE school_id = ? 
        AND CASE WHEN week LIKE 'Week %' THEN week ELSE CONCAT('Week ', week) END = ? 
        AND REPLACE(REPLACE(month_year, '-', ', '), ', ', ',') = ?
    `;

    const [result] = await db.query(sql, [school_id, week_no, month_year]);
    console.log('Result:', result);
    
    // verify the change
    const [rows] = await db.query(`
      SELECT school_id, week, month_year, school_able_to_visibale_status 
      FROM year_lp_master_new 
      WHERE school_id = ? AND week = ? AND month_year = ?
    `, [school_id, 'Week 1', 'Mar, 2026']);
    console.log('Updated Rows:', JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
