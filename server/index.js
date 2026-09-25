require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const { pool } = require('./db');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const appointmentRoutes = require('./routes/appointments');
const historyRoutes = require('./routes/history');
const messageRoutes = require('./routes/messages');
const techRoutes = require('./routes/tech');
const managerRoutes = require('./routes/manager');

const fs = require('fs');
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxies (Render, Railway, Vercel, Cloudflare)
if (isProduction || process.env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// Auto-run schema migration on server startup for cloud databases
async function ensureDbSchema() {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const schemaPath = path.join(__dirname, 'scripts', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
    }
  } catch (err) {
    console.warn('Auto-schema notice:', err.message);
  }
}
ensureDbSchema();

// Enable CORS for local testing & dev servers (e.g. Live Server on port 5500)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

const sessionStore = process.env.NODE_ENV === 'test'
  ? undefined
  : new pgSession({ pool, tableName: 'session', createTableIfMissing: true });

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'torque-app-production-secret-key-10293847',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction, // Uses HTTPS secure cookies in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/messages', messageRoutes);
const QRCode = require('qrcode');


app.use('/api/tech', techRoutes);
app.use('/api/manager', managerRoutes);

// Dynamic Scannable QR Code generation endpoint
app.get('/api/qr', async (req, res) => {
  const text = req.query.text || 'https://torque.app/checkin?pin=8492';
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      margin: 1,
      width: 280,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    // Send as PNG image directly if requested as image or format=img
    if (req.query.format === 'img') {
      const imgBuffer = Buffer.from(dataUrl.split(',')[1], 'base64');
      res.setHeader('Content-Type', 'image/png');
      return res.send(imgBuffer);
    }
    res.json({ dataUrl, text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Health check endpoint for monitoring & automated test runners
app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    dbStatus = 'disconnected';
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    services: {
      auth: 'active',
      profile: 'active',
      appointments: 'active',
      history: 'active',
      messages: 'active',
      tech: 'active',
      manager: 'active',
      qr: 'active'
    }
  });
});

// Explicit routes for all client portals & test dashboard
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});
app.post(['/', '/index.html'], (req, res) => {
  res.redirect('/');
});

app.get(['/tech', '/tech.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'tech.html'));
});

app.get(['/manager', '/manager.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'manager.html'));
});

app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'admin.html'));
});

app.get(['/test', '/test.html', '/qa'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'test.html'));
});

app.use(express.static(path.join(__dirname, '..', 'client')));

// SPA fallback for unknown non-API GET requests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Habesha Auto running at http://localhost:${PORT}`);
  });
}

module.exports = app;
