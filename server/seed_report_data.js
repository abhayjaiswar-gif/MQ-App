const mysql = require('mysql2/promise');
require('dotenv').config();
const crypto = require('crypto');

async function seedData() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'appmarcos_mainapp'
  });

  try {
    console.log('Connected to DB. Starting seed...');

    // 1. Get a test school and a test coach
    const [schools] = await db.query('SELECT id FROM schools LIMIT 1');
    if (schools.length === 0) {
      console.log('No schools found. Please create a school first.');
      return;
    }
    const school_id = 1;

    const [users] = await db.query("SELECT id FROM users WHERE role_id IN (SELECT id FROM roles WHERE name LIKE '%coach%') LIMIT 1");
    let user_id = 1; // fallback
    if (users.length > 0) {
      user_id = users[0].id;
    }

    const month_year = 'Mar, 2026';
    const weeks = ['Week 1', 'Week 2'];
    const sports = ['Football', 'Basketball', 'Tennis', 'Swimming'];

    for (const week of weeks) {
      for (let i = 0; i < sports.length; i++) {
        const sport = sports[i];
        const unique_id = crypto.randomBytes(16).toString('hex');
        const lp_no = i + 1;
        const skill = `Basic ${sport} Skills`;
        const sub_skill = `Dribbling and Passing (${week})`;
        const objective = `Students should understand the core concepts of ${sport}.`;
        const teaching_aids = 'Balls, Cones';
        const warm_up = '10 mins jogging, dynamic stretching';
        const skill_implementation = 'Drills and practice matches';
        const cool_down = '5 mins static stretching';
        const summarization = 'Review techniques learned today';
        const life_skill = 'Teamwork and Discipline';
        const grade = 5;
        const divisions = 'A, B';

        // Randomize status
        const statuses = ['Complete', 'Complete', 'Improvisation'];
        const remarks = ['Excellent progress shown by the class.', 'Good passing, needs work on shooting.', 'Students are engaged and learning fast.'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const remark = remarks[Math.floor(Math.random() * remarks.length)];

        // Insert into year_lp_master_new
        await db.query(`
          INSERT INTO year_lp_master_new 
          (unique_id, lp_no, sport, skill, sub_skill, objective, teaching_aids, warm_up, skill_implementation, cool_down, summarization, life_skill, month_year, week, grade, school_id, divisions, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [unique_id, lp_no, sport, skill, sub_skill, objective, teaching_aids, warm_up, skill_implementation, cool_down, summarization, life_skill, month_year, week, grade, school_id, divisions]);

        // Insert into coach_lesson_tracking
        await db.query(`
          INSERT INTO coach_lesson_tracking
          (unique_id, lp_no, sport, skill, sub_skill, objective, teaching_aids, warm_up, skill_implementation, cool_down, summarization, life_skill, month_year, week, grade, user_id, status, remark, school_id, divisions, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [unique_id, lp_no, sport, skill, sub_skill, objective, teaching_aids, warm_up, skill_implementation, cool_down, summarization, life_skill, month_year, week, grade, user_id, status, remark, school_id, divisions]);

        console.log(`Seeded ${sport} for ${week}`);
      }
    }

    console.log('Seeding completed successfully!');

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await db.end();
  }
}

seedData();
