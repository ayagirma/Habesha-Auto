require('dotenv').config();
const { query } = require('../db');

async function removeJordan() {
  try {
    const res = await query('DELETE FROM users WHERE email = $1', ['jordan.alvarez@email.com']);
    console.log(`Successfully removed Jordan Alvarez. Rows affected: ${res.rowCount}`);
    const users = await query('SELECT id, name, email FROM users');
    console.log('Current users in DB:', users.rows);
  } catch (err) {
    console.error('Error removing Jordan:', err);
  } finally {
    process.exit(0);
  }
}

removeJordan();
