require('dotenv').config();
const db = require('./db');

const setupTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS sggm_school_check_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT,
        user_id INT,
        school_name VARCHAR(255),
        conducted_at DATETIME,
        auditor_name VARCHAR(255),
        auditor_role VARCHAR(255),
        
        -- Section A
        punctuality VARCHAR(50),
        student_engagement VARCHAR(50),
        behavior_conduct VARCHAR(50),
        
        -- Uniform Checklist
        uniform_tshirt BOOLEAN DEFAULT FALSE,
        uniform_trackpants BOOLEAN DEFAULT FALSE,
        uniform_shoes BOOLEAN DEFAULT FALSE,
        uniform_whistle BOOLEAN DEFAULT FALSE,
        uniform_grooming BOOLEAN DEFAULT FALSE,
        
        -- Section B
        logistical_challenges TEXT, -- JSON
        areas_of_concern TEXT, -- JSON
        
        -- Section C
        principal_feedback TEXT,
        parent_feedback TEXT,
        
        -- Section D
        satisfaction_rating INT,
        major_complaints TEXT,
        
        -- Section E
        sentiment_engagement_pct INT,
        safety_feedback TEXT,
        
        -- Section F, G, H
        growth_opportunities TEXT,
        warning_signs TEXT,
        insights TEXT,
        
        -- Section I
        overall_performance VARCHAR(50),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ sggm_school_check_list table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating table:', err);
    process.exit(1);
  }
};

setupTable();
