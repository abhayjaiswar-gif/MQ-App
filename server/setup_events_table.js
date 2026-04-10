const mysql = require('mysql2/promise');
const dbConfig = { 
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'appmarcos_mainapp' 
};

async function setup() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.');

        // 1. Create Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS dashboard_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                event_date DATE NOT NULL,
                category ENUM('Sports', 'Academic', 'Event') DEFAULT 'Event',
                is_featured TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "dashboard_events" ensured.');

        // 2. Insert Dummy Data if empty
        const [rows] = await conn.query("SELECT COUNT(*) as count FROM dashboard_events");
        if (rows[0].count === 0) {
            const dummyData = [
                ['Football vs West Hills', 'Inter-school championship match at the main stadium.', '2026-10-14', 'Sports', 1],
                ['Term 1 Reports', 'Final deadline for teachers to submit grading for the first semester reports.', '2026-10-20', 'Academic', 0],
                ['Annual Sports Day', 'Full-day event at the athletic complex. All regular classes suspended.', '2026-10-28', 'Event', 1],
                ['Regionals Qualifier', 'Gymnasium A • Basketball qualifier match.', '2026-11-02', 'Sports', 1]
            ];
            
            await conn.query(
                "INSERT INTO dashboard_events (title, description, event_date, category, is_featured) VALUES ?",
                [dummyData]
            );
            console.log('✅ Initial events inserted.');
        } else {
            console.log('ℹ️ Table already has data, skipping insert.');
        }

        console.log('🚀 Events Setup finished successfully!');
    } catch (err) {
        console.error('❌ Error during setup:', err.message);
    } finally {
        if (conn) await conn.end();
    }
}

setup();
