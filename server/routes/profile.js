const express = require('express');
const { pool } = require('../db');
const { getProfile } = require('../lib/profile');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const profile = await getProfile(req.session.userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });
  res.json(profile);
});

async function updateProfileHandler(req, res) {
  const { name, email, phone, vin, year, model, miles } = req.body || {};
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4`,
      [name, email, phone, req.session.userId]
    );
    await client.query(
      `UPDATE vehicles SET vin = $1, year = $2, model = $3, miles = $4, updated_at = now() WHERE user_id = $5`,
      [vin, String(year || ''), String(model || ''), parseInt(miles, 10) || 0, req.session.userId]
    );
    await client.query('COMMIT');
    const profile = await getProfile(req.session.userId);
    res.json(profile);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('profile update failed', err);
    res.status(500).json({ error: 'Could not save profile.' });
  } finally {
    client.release();
  }
}

router.put('/', updateProfileHandler);
router.post('/', updateProfileHandler);

module.exports = router;
