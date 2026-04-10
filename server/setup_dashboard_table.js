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
            CREATE TABLE IF NOT EXISTS dashboard_social_content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content_type ENUM('video', 'photo') NOT NULL,
                title VARCHAR(255),
                url TEXT,
                thumbnail_url TEXT,
                is_active TINYINT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "dashboard_social_content" ensured.');

        // 2. Insert Dummy Data if empty
        const [rows] = await conn.query("SELECT COUNT(*) as count FROM dashboard_social_content");
        if (rows[0].count === 0) {
            const dummyData = [
                ['video', 'Academy Morning Drill', 'https://www.instagram.com/reel/C57-8...', 'https://images.unsplash.com/photo-1518611012118-2960C8bb4832'],
                ['video', 'Skills Showcase', 'https://www.instagram.com/reel/C58-X...', 'https://images.unsplash.com/photo-1526676037777-05a232554f77'],
                ['photo', 'Training Ground View', 'uploads/school1.jpg', 'uploads/school1.jpg'],
                ['photo', 'Champion Smile', 'uploads/student1.jpg', 'uploads/student1.jpg']
            ];
            
            await conn.query(
                "INSERT INTO dashboard_social_content (content_type, title, url, thumbnail_url) VALUES ?",
                [dummyData]
            );
            console.log('✅ Dummy data inserted.');
        } else {
            console.log('ℹ️ Table already has data, skipping insert.');
        }

        console.log('🚀 Setup finished successfully!');
    } catch (err) {
        console.error('❌ Error during setup:', err.message);
    } finally {
        if (conn) await conn.end();
    }
}

setup();
