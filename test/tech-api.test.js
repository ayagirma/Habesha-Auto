const request = require('supertest');
const app = require('../server/index');

describe('Technician API Endpoints (/api/tech)', () => {
  test('GET /api/tech/bays returns list of all shop bays', async () => {
    const res = await request(app).get('/api/tech/bays');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    expect(res.body[0]).toHaveProperty('bayId');
    expect(res.body[0]).toHaveProperty('status');
  });

  test('GET /api/tech/bays/:id returns specific bay details', async () => {
    const res = await request(app).get('/api/tech/bays/bay-1');
    expect(res.status).toBe(200);
    expect(res.body.bayId).toBe('bay-1');
    expect(res.body).toHaveProperty('techName');
  });

  test('GET /api/tech/bays/non-existent returns 404', async () => {
    const res = await request(app).get('/api/tech/bays/bay-999');
    expect(res.status).toBe(404);
  });

  test('PUT /api/tech/bays/:id/step updates workflow step index', async () => {
    const res = await request(app)
      .put('/api/tech/bays/bay-1/step')
      .send({ stepIndex: 3 });
    expect(res.status).toBe(200);
    expect(res.body.currentStep).toBe(3);
  });

  test('POST /api/tech/bays/:id/finding submits newly discovered issue', async () => {
    const newFinding = {
      title: 'Cracked Front Control Arm Bushing',
      explanation: 'Play observed during steering geometry inspection.',
      partsCost: 65.00,
      laborCost: 85.00,
      urgency: 'Recommended Today',
      managerApproved: true,
      canFixOnSite: true
    };
    const res = await request(app)
      .post('/api/tech/bays/bay-2/finding')
      .send(newFinding);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(newFinding.title);
    expect(res.body.totalCost).toBe(150.00);
    expect(res.body.customerStatus).toBe('pending');
  });

  test('POST /api/tech/bays/:id/call-log logs phone call attempt', async () => {
    const callLog = {
      outcome: 'Spoke with Customer',
      note: 'Customer verbally approved new finding and asked to proceed.'
    };
    const res = await request(app)
      .post('/api/tech/bays/bay-2/call-log')
      .send(callLog);
    expect(res.status).toBe(201);
    expect(res.body.outcome).toBe(callLog.outcome);
    expect(res.body).toHaveProperty('time');
  });
});
