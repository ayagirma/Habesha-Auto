const request = require('supertest');
const app = require('../server/index');

describe('Auth API Validation (/api/auth)', () => {
  test('POST /api/auth/signup rejects invalid names', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'A', email: 'valid@example.com', phone: '555-1234', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('name');
  });

  test('POST /api/auth/signup rejects invalid emails', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alex Rivera', email: 'invalid-email', phone: '555-1234', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('email');
  });

  test('POST /api/auth/signup rejects short passwords', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alex Rivera', email: 'alex@example.com', phone: '555-1234', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('password');
  });

  test('POST /api/auth/signin rejects missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: '' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/forgot-password rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'bad-email' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('email');
  });

  test('POST /api/auth/forgot-password sends OTP and allows verification & reset', async () => {
    const testEmail = 'otp.tester@example.com';
    // 1. Request OTP
    const resForgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testEmail });
    expect(resForgot.status).toBe(200);
    expect(resForgot.body.success).toBe(true);

    // 2. Fetch OTP from DB to test verification flow
    const { query } = require('../server/db');
    const dbRes = await query(
      'SELECT otp FROM password_resets WHERE email = $1 ORDER BY id DESC LIMIT 1',
      [testEmail]
    );
    expect(dbRes.rows.length).toBeGreaterThan(0);
    const validOtp = dbRes.rows[0].otp;

    // 3. Test Invalid OTP
    const resInvalidOtp = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testEmail, otp: '000000' });
    expect(resInvalidOtp.status).toBe(400);

    // 4. Test Valid OTP
    const resValidOtp = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: testEmail, otp: validOtp });
    expect(resValidOtp.status).toBe(200);
    expect(resValidOtp.body.valid).toBe(true);

    // 5. Test Reset Password with short password
    const resShortPass = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: testEmail, otp: validOtp, newPassword: '123' });
    expect(resShortPass.status).toBe(400);
    expect(resShortPass.body.field).toBe('newPassword');

    // 6. Test Successful Password Reset
    const resReset = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: testEmail, otp: validOtp, newPassword: 'newsecurepass123' });
    expect(resReset.status).toBe(200);
    expect(resReset.body.success).toBe(true);

    // 7. Test OTP cannot be reused
    const resReused = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: testEmail, otp: validOtp, newPassword: 'anotherpassword123' });
    expect(resReused.status).toBe(400);
  });
});

