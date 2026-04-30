require('dotenv').config();
const db = require('./db');

async function run() {
  try {
    // 1. Drop the old unique constraint if it exists
    try {
      await db.query('ALTER TABLE ptm_user_unlocks DROP INDEX unique_user_unlock');
    } catch (e) {
      console.log('Index unique_user_unlock might not exist or already dropped.');
    }

    // 2. Add school_id column if it doesn't exist
    const [cols] = await db.query('SHOW COLUMNS FROM ptm_user_unlocks LIKE "school_id"');
    if (cols.length === 0) {
      await db.query('ALTER TABLE ptm_user_unlocks ADD COLUMN school_id INT DEFAULT NULL AFTER user_id');
      console.log('✅ Added school_id column');
    }

    // 3. Create new unique index on (user_id, school_id)
    // We'll use a new index name to avoid confusion
    await db.query('CREATE UNIQUE INDEX idx_user_school_unlock ON ptm_user_unlocks (user_id, school_id)');
    console.log('✅ Created unique index on (user_id, school_id)');

    process.exit(0);
  } catch (err) {
    console.error('MIGRATION ERROR:', err);
    process.exit(1);
  }
}

run();
