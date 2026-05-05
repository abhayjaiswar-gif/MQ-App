const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertTestData() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'appmarcos_mainapp'
  });

  try {
    console.log('Inserting test data for School 6, May 2026, Week 1...');
    
    const testData = [
      {
        school_id: 6,
        coach_id: 139,
        sport: 'Football',
        lecture_date: '2026-05-02',
        start_time: '08:00:00',
        end_time: '09:00:00',
        grades: '3,4',
        division: 'A',
        status: 'Completed'
      },
      {
        school_id: 6,
        coach_id: 139,
        sport: 'Basketball',
        lecture_date: '2026-05-03',
        start_time: '09:00:00',
        end_time: '10:00:00',
        grades: '5,6',
        division: 'B',
        status: 'Completed'
      },
      {
        school_id: 6,
        coach_id: 139,
        sport: 'Cricket',
        lecture_date: '2026-05-05',
        start_time: '10:00:00',
        end_time: '11:00:00',
        grades: '7,8',
        division: 'A',
        status: 'Completed'
      }
    ];

    for (const item of testData) {
      await db.query(`
        INSERT INTO marked_lectures 
        (school_id, coach_id, sport, lecture_date, start_time, end_time, grades, division, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.school_id, item.coach_id, item.sport, item.lecture_date, 
        item.start_time, item.end_time, item.grades, item.division, item.status
      ]);
    }

    console.log('Success: Inserted 3 test lectures for Week 1 (May 1-7).');

  } catch (err) {
    console.error('Insert Error:', err);
  } finally {
    await db.end();
  }
}

insertTestData();
