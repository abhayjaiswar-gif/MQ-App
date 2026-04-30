const db = require('../server/db');
const { v4: uuidv4 } = require('uuid');
function getCurrentMonthYear() {
  const date = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]}-${date.getFullYear()}`;
}
async function seedCurriculum() {
  try {
    console.log('🚀 Starting targeted curriculum seeding (3 weeks for current month)...');
    const [rows] = await db.query(`SELECT * FROM year_lp_master`);
    const map = {};
    rows.forEach(row => {
      const key = `${row.sport}__${row.grade}`;
      if (!map[key]) map[key] = [];
      map[key].push(row);
    });
    await db.query(`TRUNCATE TABLE year_lp_master_new`);
    console.log('🧹 Cleared year_lp_master_new');
    const currentMonthYear = getCurrentMonthYear();
    for (const key in map) {
      const group = map[key];
      if (group.length < 3) continue;
      const templates = group.slice(0, 3);
      for (let i = 0; i < templates.length; i++) {
        const t = templates[i];
        const weekNo = `Week ${i + 1}`;
        await db.query(
          `INSERT INTO year_lp_master_new 
          (unique_id, lp_no, sport, grade, skill, sub_skill, month_year, week, objective, warm_up, skill_implementation, teaching_aids, summarization, life_skill, picture, cool_down) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            i + 1,
            t.sport,
            t.grade,
            t.skill,
            t.sub_skill,
            currentMonthYear,
            weekNo,
            t.objective,
            t.warm_up,
            t.skill_implementation,
            t.teaching_aids,
            t.summarization,
            t.life_skill,
            t.picture,
            t.cool_down
          ]
        );
      }
      console.log(`✅ Seeded 3 weeks of ${currentMonthYear} for ${key}`);
    }
    console.log('🎉 Targeted seeding completed successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}
seedCurriculum();