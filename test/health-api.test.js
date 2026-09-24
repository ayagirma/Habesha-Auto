const request = require('supertest');
const app = require('../server/index');

describe('API Health Endpoint (/api/health)', () => {
  test('GET /api/health returns 200 with service statuses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('services');
    expect(res.body.services.tech).toBe('active');
    expect(res.body.services.manager).toBe('active');
    expect(res.body.services.auth).toBe('active');
    expect(res.body.services.qr).toBe('active');
  });

  test('GET /api/qr generates a valid base64 dataUrl', async () => {
    const res = await request(app).get('/api/qr?text=TEST-PIN-8492');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dataUrl');
    expect(res.body.dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
