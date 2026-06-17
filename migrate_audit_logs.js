const db = require('./db');

async function migrate() {
  try {
    console.log('Creating verification_audit_logs table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS verification_audit_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        student_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        student_name VARCHAR(255),
        youtube_handle VARCHAR(255),
        platform VARCHAR(50),
        video_id VARCHAR(50),
        source VARCHAR(50),
        comments_found INTEGER,
        match_found BOOLEAN,
        status VARCHAR(255),
        reason TEXT
      );
    `);
    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
