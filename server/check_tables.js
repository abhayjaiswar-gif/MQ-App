const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
    const db = await mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'appmarcos_mainapp'
    });

    const [rows] = await db.query("SELECT TABLE_NAME FROM information_schema.COLUMNS WHERE COLUMN_NAME = 'max_score2' AND TABLE_SCHEMA = 'appmarcos_mainapp'");
    fs.writeFileSync('/tmp/table.json', JSON.stringify(rows));
    process.exit(0);
}

main().catch(console.error);
