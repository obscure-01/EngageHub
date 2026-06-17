const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const res = await pool.query(\SELECT * FROM tasks WHERE platform='YouTube' ORDER BY id DESC LIMIT 1\);
    console.log('Task:', res.rows[0]);
    pool.end();
}
run();
