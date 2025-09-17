const { Client } = require('pg');
require('dotenv').config();

const createDatabase = async () => {
  // Connect to PostgreSQL server (not to specific database)
  const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('🔄 Connected to PostgreSQL server...');

    // Check if database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const result = await client.query(checkDbQuery, [process.env.DB_DATABASE]);

    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      const createDbQuery = `CREATE DATABASE "${process.env.DB_DATABASE}"`;
      await client.query(createDbQuery);
      console.log(`✅ Database "${process.env.DB_DATABASE}" created successfully!`);
    } else {
      console.log(`ℹ️  Database "${process.env.DB_DATABASE}" already exists.`);
    }

  } catch (error) {
    console.error('❌ Error creating database:', error.message);
  } finally {
    await client.end();
  }
};

createDatabase();
