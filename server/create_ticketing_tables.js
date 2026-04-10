const mysql = require('mysql2/promise');
const dbConfig = { 
  host: 'localhost', 
  user: 'root', 
  password: '', 
  database: 'appmarcos_mainapp' 
};

(async () => { 
  try { 
    const conn = await mysql.createConnection(dbConfig); 
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ticket_escalation_rules ( 
        id INT AUTO_INCREMENT PRIMARY KEY, 
        tier_level INT NOT NULL, 
        assigned_role_id INT NULL, 
        assigned_user_id INT NULL, 
        timeout_hours INT DEFAULT 12, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
      )
    `); 

    await conn.query(`
      CREATE TABLE IF NOT EXISTS hierarchical_tickets ( 
        id INT AUTO_INCREMENT PRIMARY KEY, 
        subject VARCHAR(255) NULL, 
        name VARCHAR(100) NOT NULL, 
        email VARCHAR(150) NOT NULL, 
        message TEXT NOT NULL, 
        current_tier INT DEFAULT 1, 
        assigned_role_id INT NULL, 
        assigned_user_id INT NULL, 
        status ENUM('pending', 'resolved', 'escalated', 'closed') DEFAULT 'pending', 
        last_escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
      )
    `); 

    // Insert a default escalation rule (Tier 1 -> Administrator)
    // Administrator is role_id 1
    const [existing] = await conn.query('SELECT * FROM ticket_escalation_rules WHERE tier_level = 1');
    if (existing.length === 0) {
      await conn.query('INSERT INTO ticket_escalation_rules (tier_level, assigned_role_id, timeout_hours) VALUES (1, 1, 12)');
    }

    console.log('Tables created successfully'); 
    await conn.end(); 
  } catch (err) { 
    console.error(err); 
    process.exit(1);
  } 
})();
