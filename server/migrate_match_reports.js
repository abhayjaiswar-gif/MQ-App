const db = require('./db');

async function createTable() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS match_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                school_id INT NOT NULL,
                match_date DATE NOT NULL,
                category VARCHAR(50) NOT NULL,
                status ENUM('PUBLISHED', 'DRAFT') DEFAULT 'DRAFT',
                file_path VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
            )
        `;
        await db.query(sql);
        console.log('Table match_reports created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error creating match_reports table:', err);
        process.exit(1);
    }
}

createTable();
