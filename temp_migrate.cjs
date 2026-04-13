const db = require('./server/db'); 
async function ensureTable() { 
  const query = `CREATE TABLE IF NOT EXISTS coach_lesson_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    unique_id VARCHAR(100), 
    lp_no INT, 
    sport VARCHAR(255), 
    skill VARCHAR(255), 
    sub_skill VARCHAR(255), 
    objective MEDIUMTEXT, 
    teaching_aids MEDIUMTEXT, 
    warm_up MEDIUMTEXT, 
    skill_implementation MEDIUMTEXT, 
    picture VARCHAR(500), 
    cool_down MEDIUMTEXT, 
    summarization MEDIUMTEXT, 
    life_skill VARCHAR(255), 
    month_year VARCHAR(20), 
    week VARCHAR(20), 
    grade VARCHAR(50), 
    user_id INT, 
    status VARCHAR(50), 
    remark TEXT, 
    evidence_photo VARCHAR(500), 
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`; 
  try { 
    await db.query(query); 
    console.log('✅ Created table coach_lesson_tracking successfully'); 
  } catch (e) { 
    console.error('Failed to create table', e); 
  } finally { 
    process.exit(0); 
  } 
} 
ensureTable();
