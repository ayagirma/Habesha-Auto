const express = require('express');
const { query } = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

function toClientShape(row) {
  return {
    id: row.id,
    service: row.service,
    date: row.service_date,
    miles: row.miles,
    cost: parseFloat(row.cost),
    note: row.note,
    icon: row.icon,
    paidVia: row.paid_via,
  };
}

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [req.session.userId]
  );
  res.json(rows.map(toClientShape));
});

router.post('/', async (req, res) => {
  const { service, date, miles, cost, note, icon, paidVia } = req.body || {};
  if (!service || typeof cost !== 'number') {
    return res.status(400).json({ error: 'Missing service or cost.' });
  }
  const { rows } = await query(
    `INSERT INTO history (user_id, service, service_date, miles, cost, note, icon, paid_via)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.session.userId, service, date || '', String(miles || ''), cost, note || '', icon || '', paidVia || null]
  );
  res.status(201).json(toClientShape(rows[0]));
});

module.exports = router;
