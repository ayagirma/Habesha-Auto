const request = require('supertest');
const app = require('../server/index');

describe('Manager API Endpoints (/api/manager)', () => {
  test('GET /api/manager/kpis returns shop performance metrics', async () => {
    const res = await request(app).get('/api/manager/kpis');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todayRevenue');
    expect(res.body).toHaveProperty('activeBayUtilization');
    expect(res.body).toHaveProperty('carsCompletedToday');
  });

  test('GET /api/manager/technicians returns technician roster and efficiency', async () => {
    const res = await request(app).get('/api/manager/technicians');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('assignedBay');
  });

  test('GET /api/manager/queue returns vehicle intake queue', async () => {
    const res = await request(app).get('/api/manager/queue');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/manager/findings returns findings under review', async () => {
    const res = await request(app).get('/api/manager/findings');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/manager/register-staff creates a pending technician or manager', async () => {
    const newStaff = {
      name: 'Jordan Lee',
      email: 'jordan.lee@torque.com',
      phone: '(555) 777-8899',
      role: 'technician',
      specialization: 'Hybrid & High-Voltage Battery Systems'
    };
    const res = await request(app)
      .post('/api/manager/register-staff')
      .send(newStaff);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('technician');
    expect(res.body.status).toBe('pending_approval');
  });

  test('POST /api/manager/admit admits a vehicle into a bay', async () => {
    const admission = {
      customerName: 'Samira Patel',
      phone: '(555) 321-4567',
      vehicle: '2022 Hyundai Ioniq 5',
      plate: '5EV901',
      service: 'Tire Balance & High Voltage Check',
      bayId: 'bay-4'
    };
    const res = await request(app)
      .post('/api/manager/admit')
      .send(admission);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.admission.bayId).toBe('bay-4');
  });
});
