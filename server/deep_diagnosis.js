const mysql = require('mysql2/promise');
require('dotenv').config();

async function runDiagnosis() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'appmarcos_mainapp'
  });

  try {
    console.log('--- TABLE SCHEMA: marked_lectures ---');
    const [columns] = await db.query('DESCRIBE marked_lectures');
    console.table(columns);

    console.log('\n--- DATA SAMPLES: marked_lectures ---');
    const [samples] = await db.query('SELECT id, school_id, sport, lecture_date FROM marked_lectures LIMIT 20');
    console.table(samples.map(s => ({
      ...s,
      lecture_date_raw: s.lecture_date,
      formatted_test: s.lecture_date ? new Date(s.lecture_date).toDateString() : 'NULL'
    })));

    console.log('\n--- TESTING THE ATTENDANCE QUERY LOGIC ---');
    // Let's test for a sample school_id and date from the table
    if (samples.length > 0) {
      const testSchool = samples[0].school_id;
      const testDate = new Date(samples[0].lecture_date);
      const testMonth = testDate.toLocaleString('en-US', { month: 'short' }) + ', ' + testDate.getFullYear();
      const testWeek = 'Week ' + (Math.floor((testDate.getDate() - 1) / 7) + 1);

      console.log(`Test Parameters: School=${testSchool}, Month="${testMonth}", Week="${testWeek}"`);

      const [results] = await db.query(`
        SELECT id, lecture_date, sport,
               DATE_FORMAT(lecture_date, '%b, %Y') as m_fmt,
               CONCAT('Week ', (FLOOR((DAY(lecture_date) - 1) / 7) + 1)) as w_fmt
        FROM marked_lectures
        WHERE school_id = ?
      `, [testSchool]);

      console.log('Results for School ' + testSchool + ':');
      console.table(results.map(r => ({
        ...r,
        matches_month: r.m_fmt === testMonth,
        matches_week: r.w_fmt === testWeek
      })));
    } else {
      console.log('No data found in marked_lectures at all!');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
}

runDiagnosis();
