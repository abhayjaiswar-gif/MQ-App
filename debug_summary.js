
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function test() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        const userId = 4; // Arbitrary ID
        console.log(`Testing for userId: ${userId}`);

        const [[user]] = await db.query('SELECT role_id FROM users WHERE id = ?', [userId]);
        console.log('User Role:', user ? user.role_id : 'Not Found');

        const isAdmin = user && user.role_id < 4;
        console.log('Is Admin:', isAdmin);

        let rows;
        if (isAdmin) {
            [rows] = await db.query(`
                SELECT 
                  alp.id, alp.lp_no as lp_id, alp.lp_unique_id, alp.week as week_no, 
                  alp.month_year, alp.school_id, alp.created_at as assign_date,
                  alp.sport, alp.skill, alp.sub_skill, alp.objective, alp.grade,
                  sch.name as school_name,
                  ls.status AS lp_status, ls.remark AS lp_remark
                FROM assigned_lesson_plans alp
                LEFT JOIN schools sch ON alp.school_id = sch.id
                LEFT JOIN lp_status ls ON ls.lp_unique_id = alp.lp_unique_id AND ls.user_id = alp.assigned_to
                ORDER BY alp.created_at DESC
                LIMIT 5
            `);
        } else {
            [rows] = await db.query(`
                SELECT 
                  alp.id, alp.lp_no as lp_id, alp.lp_unique_id, alp.week as week_no, 
                  alp.month_year, alp.school_id, alp.created_at as assign_date,
                  alp.sport, alp.skill, alp.sub_skill, alp.objective, alp.grade,
                  sch.name as school_name,
                  ls.status AS lp_status, ls.remark AS lp_remark
                FROM assigned_lesson_plans alp
                LEFT JOIN schools sch ON alp.school_id = sch.id
                LEFT JOIN lp_status ls ON ls.lp_unique_id = alp.lp_unique_id AND ls.user_id = alp.assigned_to
                WHERE alp.assigned_to = ? OR alp.assigned_by = ?
                ORDER BY alp.created_at DESC
                LIMIT 5
            `, [userId, userId]);
        }

        console.log('Rows found:', rows.length);
        if (rows.length > 0) {
            console.log('First row example:', rows[0]);
        }

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await db.end();
    }
}

test();
