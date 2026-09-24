const { query } = require('../db');

async function getProfile(userId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone,
            v.vin, v.year, v.model, v.miles
     FROM users u
     LEFT JOIN vehicles v ON v.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    user: { id: r.id, name: r.name, email: r.email, phone: r.phone },
    vehicle: { vin: r.vin, year: r.year, model: r.model, miles: r.miles },
  };
}

module.exports = { getProfile };
