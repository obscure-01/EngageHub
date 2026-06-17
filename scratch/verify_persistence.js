const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyPersistence() {
  console.log('=== STARTING PERSISTENCE VERIFICATION ===');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // 1. Verify user Ram Sharma (ram@email.com) exists
    const userResult = await pool.query("SELECT * FROM users WHERE email = 'ram@email.com'");
    if (userResult.rows.length > 0) {
      console.log('✅ Success: Ram Sharma (ram@email.com) exists in the database.');
    } else {
      console.error('❌ Failure: Ram Sharma (ram@email.com) was NOT found in the database!');
    }

    // 2. Verify tasks count and specific new tasks exist
    const taskCountResult = await pool.query('SELECT COUNT(*)::int FROM tasks');
    console.log(`Current task count: ${taskCountResult.rows[0].count} (Expected: 8)`);

    const linkedinTask = await pool.query("SELECT * FROM tasks WHERE title = 'LinkedIn Network Expansion Post'");
    if (linkedinTask.rows.length > 0) {
      console.log('✅ Success: LinkedIn task exists in the database.');
    } else {
      console.error('❌ Failure: LinkedIn task was NOT found in the database!');
    }

    const facebookTask = await pool.query("SELECT * FROM tasks WHERE title = 'Facebook Alumni Meet Group'");
    if (facebookTask.rows.length > 0) {
      console.log('✅ Success: Facebook task exists in the database.');
    } else {
      console.error('❌ Failure: Facebook task was NOT found in the database!');
    }

    await pool.end();
  } catch (error) {
    console.error('Database connection or query failed:', error);
    await pool.end();
  }
}

verifyPersistence();
