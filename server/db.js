require('dotenv').config();
const { Pool } = require('pg');

const isCloudDb = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('neon.tech') ||
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('render.com') ||
  process.env.DATABASE_URL.includes('railway.app') ||
  process.env.DATABASE_URL.includes('sslmode=require') ||
  process.env.NODE_ENV === 'production'
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: process.env.NODE_ENV === 'test' ? 800 : 10000,
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};

