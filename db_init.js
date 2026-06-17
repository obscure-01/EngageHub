const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function initializeDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  // Parse connection string to get the database name and connect to default postgres db first
  let defaultConnString = connectionString;
  let dbName = 'EngageHub';
  
  try {
    const url = new URL(connectionString);
    dbName = url.pathname.substring(1) || 'EngageHub';
    url.pathname = '/postgres'; // Redirect to default maintenance database
    defaultConnString = url.toString();
  } catch (e) {
    const match = connectionString.match(/\/([^/?]+)(\?|$)/);
    if (match) {
      dbName = match[1];
      defaultConnString = connectionString.replace(`/${dbName}`, '/postgres');
    }
  }

  console.log(`Connecting to default 'postgres' database to check/create '${dbName}'...`);
  const defaultPool = new Pool({ connectionString: defaultConnString });
  
  try {
    const defaultClient = await defaultPool.connect();
    
    // Check if target database exists
    const dbCheck = await defaultClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (dbCheck.rows.length === 0) {
      console.log(`Database '${dbName}' does not exist. Creating it...`);
      await defaultClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
    
    defaultClient.release();
    await defaultPool.end();
  } catch (err) {
    console.warn(`Note: Could not check/create '${dbName}' via default DB:`, err.message);
    console.log('Proceeding to connect directly to the target database...');
    await defaultPool.end();
  }

async function isDatabaseEmpty(client) {
  try {
    // Check if the users table exists in the public schema
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return true;
    }

    // Check if users table is empty
    const countCheck = await client.query('SELECT COUNT(*)::int FROM users');
    return countCheck.rows[0].count === 0;
  } catch (err) {
    return true;
  }
}

async function hasProductionData(client) {
  if (await isDatabaseEmpty(client)) {
    return false;
  }

  // Check if there are users with emails not in the default seed emails
  const seedEmails = [
    'admin@engagehub.edu',
    'alex@engagehub.edu',
    'aman@engagehub.edu',
    'priya@engagehub.edu',
    'rahul@engagehub.edu',
    'sneha@engagehub.edu',
    'ram@engagehub.edu'
  ];

  const nonSeedUsers = await client.query(
    'SELECT COUNT(*)::int FROM users WHERE email NOT IN ($1, $2, $3, $4, $5, $6, $7)',
    seedEmails
  );
  if (nonSeedUsers.rows[0].count > 0) {
    return true; // Found custom registered student or other user
  }

  // Check if a seed user has been deleted
  const totalUsers = await client.query('SELECT COUNT(*)::int FROM users');
  if (totalUsers.rows[0].count < seedEmails.length) {
    return true; // A student was deleted
  }

  // Check if any seed user has points different from their initial seed points
  const seedPoints = {
    'admin@engagehub.edu': 0,
    'alex@engagehub.edu': 120,
    'aman@engagehub.edu': 210,
    'priya@engagehub.edu': 180,
    'rahul@engagehub.edu': 170,
    'sneha@engagehub.edu': 150,
    'ram@engagehub.edu': 15
  };
  const users = await client.query('SELECT email, points FROM users');
  for (const row of users.rows) {
    if (seedPoints[row.email] !== undefined && row.points !== seedPoints[row.email]) {
      return true; // Points changed (activity performed)
    }
  }

  // Check if there are tasks not in the seed tasks
  const seedTasks = [
    'AI Workshop Reel',
    'Tech Fest Highlights Reel',
    'Placement Preparation Video',
    'Innovation Showcase Video',
    'Career Fair Announcement',
    'College Hackathon Promo'
  ];
  const nonSeedTasks = await client.query(
    'SELECT COUNT(*)::int FROM tasks WHERE title NOT IN ($1, $2, $3, $4, $5, $6)',
    seedTasks
  );
  if (nonSeedTasks.rows[0].count > 0) {
    return true; // Custom tasks created
  }

  // Check if a seed task has been deleted
  const totalTasks = await client.query('SELECT COUNT(*)::int FROM tasks');
  if (totalTasks.rows[0].count < seedTasks.length) {
    return true; // A task was deleted
  }

  // Check if there are task activities other than the seed ones
  const totalActivity = await client.query('SELECT COUNT(*)::int FROM task_activity');
  if (totalActivity.rows[0].count !== 9) {
    return true; // Activity count changed
  }

  return false;
}

// Connect to the target database and execute migrations
  console.log(`Connecting directly to database '${dbName}' to run migrations...`);
  const targetPool = new Pool({ connectionString });
  try {
    const client = await targetPool.connect();
    
    // Check if the database contains production data to protect it
    const hasProdData = await hasProductionData(client);
    if (hasProdData) {
      console.log('⚠️  Database contains existing production data (custom students, tasks, or modified points).');
      console.log('Skipping database re-initialization to prevent overwriting/data loss.');
      client.release();
      await targetPool.end();
      process.exit(0);
    }

    console.log('Connected successfully. Setting up tables...');
    
    // Read and run schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('Database tables initialized.');

    // Read and run seed.sql
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seedSql);
    console.log('Sample data seeded successfully.');

    client.release();
    await targetPool.end();
    console.log('Database initialization completed.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ DATABASE INITIALIZATION ERROR:');
    console.error(error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure your PostgreSQL server is running locally on port 5432.');
    console.error('2. Verify that your database credentials in the .env file are correct.');
    console.error('3. Make sure the database user has permissions to create tables.');
    process.exit(1);
  }
}

initializeDatabase();
