require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const role = decodeURIComponent(dbUrl.username);
  const password = decodeURIComponent(dbUrl.password);
  const database = dbUrl.pathname.replace(/^\//, '');
  const host = dbUrl.hostname;
  const port = dbUrl.port || 5432;

  // Connect as the local superuser (trust auth) to create the app role + database if missing.
  const admin = new Client({ user: 'postgres', host, port, database: 'postgres' });
  await admin.connect();
  try {
    const roleExists = await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [role]);
    if (roleExists.rowCount === 0) {
      await admin.query(`CREATE ROLE ${admin.escapeIdentifier(role)} LOGIN PASSWORD '${password.replace(/'/g, "''")}'`);
      console.log(`Created role "${role}".`);
    } else {
      console.log(`Role "${role}" already exists.`);
    }

    const dbExists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (dbExists.rowCount === 0) {
      await admin.query(`CREATE DATABASE ${admin.escapeIdentifier(database)} OWNER ${admin.escapeIdentifier(role)}`);
      console.log(`Created database "${database}".`);
    } else {
      console.log(`Database "${database}" already exists.`);
    }
  } finally {
    await admin.end();
  }

  // Now connect to the app database (as the app role) and run the schema.
  const appDb = new Client({ user: role, password, host, port, database });
  await appDb.connect();
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await appDb.query(schema);
    console.log('Schema applied.');

  } finally {
    await appDb.end();
  }

  console.log('Database setup complete.');
}

main().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
