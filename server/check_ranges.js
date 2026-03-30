const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
    const db = await mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'appmarcos_mainapp'
    });

    const [rows] = await db.query(`
        SELECT pr.*, pi.title, pi.ctype 
        FROM parameter_ranges pr 
        JOIN parameter_info pi ON pr.parameter = pi.id 
        WHERE pi.title LIKE '%Jumping%' OR pi.title LIKE '%Handling%' OR pi.title LIKE '%Hopping%'
        LIMIT 10;
    `);

    fs.writeFileSync('/tmp/ranges.json', JSON.stringify(rows, null, 2));
    process.exit(0);
}

main().catch(console.error);
