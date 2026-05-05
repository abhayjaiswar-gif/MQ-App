const db = require('./db');
const bcrypt = require('bcrypt');

async function run() {
  try {
    const emails = ['laxman@mq.com', 'rahul@mq.com', 'raahil@mq.com'];
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('mq12345', saltRounds);

    for (const email of emails) {
      await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
      console.log(`Password updated for ${email}`);
    }
    console.log('All passwords updated with bcrypt hashing.');
  } catch (e) {
    console.log(e.message);
  }
  process.exit();
}
run();
