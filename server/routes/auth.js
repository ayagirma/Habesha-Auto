const express = require('express');
const bcrypt = require('bcryptjs');
const { query, pool } = require('../db');
const { getProfile } = require('../lib/profile');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, phone, password, vin, plate, year, model, miles } = req.body || {};

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ field: 'name', error: 'Enter your name.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ field: 'email', error: 'Enter a valid email.' });
  }
  if (!phone || String(phone).trim().length < 7) {
    return res.status(400).json({ field: 'phone', error: 'Enter a phone number.' });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ field: 'password', error: 'Password must be at least 8 characters.' });
  }

  // VIN is optional during customer onboarding; technician can scan on bay intake
  let assignedVin = 'PENDING-BAY-SCAN';
  if (vin && String(vin).trim().length > 0) {
    assignedVin = String(vin).trim().toUpperCase();
  } else if (plate && String(plate).trim().length > 0) {
    assignedVin = `PLATE:${String(plate).trim().toUpperCase()}`;
  }

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT 1 FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ field: 'email', error: 'An account already exists with this email.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');
    const userResult = await client.query(
      `INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name.trim(), email.trim().toLowerCase(), phone.trim(), passwordHash]
    );
    const userId = userResult.rows[0].id;
    await client.query(
      `INSERT INTO vehicles (user_id, vin, year, model, miles) VALUES ($1, $2, $3, $4, $5)`,
      [userId, assignedVin, String(year || '2022'), String(model || 'Vehicle'), parseInt(miles, 10) || 0]
    );
    await client.query('COMMIT');

    req.session.userId = userId;
    const profile = await getProfile(userId);
    res.status(201).json(profile);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('signup failed', err);
    res.status(500).json({ error: 'Something went wrong creating your account.' });
  } finally {
    client.release();
  }
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  try {
    const { rows } = await query('SELECT id, password_hash FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'No account found with that email and password.' });
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'No account found with that email and password.' });
    }
    req.session.userId = rows[0].id;
    const profile = await getProfile(rows[0].id);
    res.json(profile);
  } catch (err) {
    console.error('signin failed', err);
    res.status(500).json({ error: 'Something went wrong signing you in.' });
  }
});

router.get(['/me', '/session'], async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const profile = await getProfile(req.session.userId);
    if (!profile) {
      return res.status(401).json({ error: 'User profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error('auth me failed', err);
    res.status(500).json({ error: 'Failed to retrieve active session' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

const { sendOtpEmail } = require('../lib/mailer');

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return res.status(400).json({ field: 'email', error: 'Please enter a valid email address.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    // Check if user exists in the database
    const userRes = await query('SELECT id, name FROM users WHERE email = $1', [normalizedEmail]);
    const userName = userRes.rows.length > 0 ? userRes.rows[0].name : 'Valued User';

    // Invalidate existing active OTPs for this email
    await query('UPDATE password_resets SET used = true WHERE email = $1 AND used = false', [normalizedEmail]);

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in password_resets (valid for 10 minutes)
    await query(
      `INSERT INTO password_resets (email, otp, expires_at)
       VALUES ($1, $2, now() + interval '10 minutes')`,
      [normalizedEmail, otp]
    );

    // Dispatch email
    const mailResult = await sendOtpEmail(normalizedEmail, otp, userName);
    const isRealSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      expiresInMinutes: 10,
      devOtp: isRealSmtp ? undefined : otp,
      deliveryMethod: isRealSmtp ? 'smtp_inbox' : 'dev_simulator'
    });
  } catch (err) {
    console.error('forgot-password failed:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  try {
    const { rows } = await query(
      `SELECT id, expires_at FROM password_resets 
       WHERE email = $1 AND otp = $2 AND used = false AND expires_at > now()
       ORDER BY id DESC LIMIT 1`,
      [normalizedEmail, cleanOtp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit code. Please request a new one.' });
    }

    res.json({ success: true, valid: true, message: 'OTP verified successfully.' });
  } catch (err) {
    console.error('verify-otp failed:', err);
    res.status(500).json({ error: 'Failed to verify code.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body || {};
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ field: 'newPassword', error: 'Password must be at least 8 characters.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify OTP
    const otpRes = await client.query(
      `SELECT id FROM password_resets 
       WHERE email = $1 AND otp = $2 AND used = false AND expires_at > now()
       ORDER BY id DESC LIMIT 1`,
      [normalizedEmail, cleanOtp]
    );

    if (otpRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new one.' });
    }

    const resetId = otpRes.rows[0].id;
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password if exists
    const userUpdate = await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id',
      [passwordHash, normalizedEmail]
    );

    // Mark OTP as used
    await client.query('UPDATE password_resets SET used = true WHERE id = $1', [resetId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Password successfully updated! You can now sign in with your new password.',
      accountFound: userUpdate.rows.length > 0
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('reset-password failed:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  } finally {
    client.release();
  }
});

router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
  const profile = await getProfile(req.session.userId);
  if (!profile) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
  res.json(profile);
});

module.exports = router;

