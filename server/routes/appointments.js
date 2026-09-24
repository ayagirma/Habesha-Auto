const express = require('express');
const { query } = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

function toClientShape(row) {
  if (!row) return null;
  return {
    serviceIdxs: row.service_idxs,
    day: { dow: row.day_dow, num: row.day_num },
    time: row.time_label,
    stepIndex: row.step_index,
    status: row.status,
    statusLabel: row.status_label,
    extraDecision: row.extra_decision,
    basePrice: parseFloat(row.base_price),
  };
}

router.get('/current', async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM appointments WHERE user_id = $1 AND active = true ORDER BY updated_at DESC LIMIT 1`,
    [req.session.userId]
  );
  res.json(toClientShape(rows[0]));
});

router.put('/current', async (req, res) => {
  const { serviceIdxs, day, time, stepIndex, status, statusLabel, extraDecision, basePrice } = req.body || {};
  if (!Array.isArray(serviceIdxs) || serviceIdxs.length === 0) {
    return res.status(400).json({ error: 'An appointment needs at least one service.' });
  }

  const existing = await query(
    `SELECT id FROM appointments WHERE user_id = $1 AND active = true LIMIT 1`,
    [req.session.userId]
  );

  const params = [
    JSON.stringify(serviceIdxs),
    (day && day.dow) || '',
    (day && day.num) || 0,
    time || '',
    typeof stepIndex === 'number' ? stepIndex : -1,
    status || 'scheduled',
    statusLabel || '',
    extraDecision || null,
    typeof basePrice === 'number' ? basePrice : 0,
    req.session.userId,
  ];

  let row;
  if (existing.rowCount > 0) {
    const { rows } = await query(
      `UPDATE appointments SET
         service_idxs = $1, day_dow = $2, day_num = $3, time_label = $4,
         step_index = $5, status = $6, status_label = $7, extra_decision = $8,
         base_price = $9, updated_at = now()
       WHERE user_id = $10 AND active = true
       RETURNING *`,
      params
    );
    row = rows[0];
  } else {
    const { rows } = await query(
      `INSERT INTO appointments
         (service_idxs, day_dow, day_num, time_label, step_index, status, status_label, extra_decision, base_price, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      params
    );
    row = rows[0];
  }
  res.json(toClientShape(row));
});

router.delete('/current', async (req, res) => {
  await query(
    `UPDATE appointments SET active = false, updated_at = now() WHERE user_id = $1 AND active = true`,
    [req.session.userId]
  );
  res.status(204).end();
});

module.exports = router;
