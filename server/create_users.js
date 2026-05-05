const db = require('./db');
async function run() {
  try {
    const users = [
      { name: 'Laxman', role_id: 2, email: 'laxman@mq.com', mq_id: 'MQ0091' },
      { name: 'Rahul', role_id: 9, email: 'rahul@mq.com', mq_id: 'MQ0092' },
      { name: 'Raahil', role_id: 10, email: 'raahil@mq.com', mq_id: 'MQ0093' }
    ];
    for (const u of users) {
      const hash = Math.random().toString(36).substring(2, 15);
      await db.query("INSERT INTO users (name, role_id, email, password, hash_key, mq_id, is_super_admin, is_active, mobile, address_line1, address_line2, city, state, pincode, remarks, profile_pic, app_access, web_access, added_date, added_by, added_ip) VALUES (?, ?, ?, ?, ?, ?, 0, 1, '0000000000', '', '', '', '', '', '', '', 1, 1, NOW(), 1, '127.0.0.1')", 
      [u.name, u.role_id, u.email, 'mq12345', hash, u.mq_id]);
    }
    console.log('Users created successfully');
  } catch (e) {
    console.log(e.message);
  }
  process.exit();
}
run();
