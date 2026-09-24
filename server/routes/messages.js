const express = require('express');
const { query } = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

function toClientShape(row) {
  return { id: row.id, from: row.from_role, text: row.text, at: row.at };
}

router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM messages WHERE user_id = $1 ORDER BY at ASC LIMIT 50`,
    [req.session.userId]
  );
  res.json(rows.map(toClientShape));
});

router.post('/', async (req, res) => {
  const { from, text } = req.body || {};
  if (!text || !['customer', 'shop'].includes(from)) {
    return res.status(400).json({ error: 'Missing message text or sender.' });
  }
  const { rows } = await query(
    `INSERT INTO messages (user_id, from_role, text) VALUES ($1,$2,$3) RETURNING *`,
    [req.session.userId, from, text]
  );
  res.status(201).json(toClientShape(rows[0]));
});

module.exports = router;
