const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { ensureDefaultData } = require('./utils/seed');

const app = express();
let reconnectTimer = null;
const projectRoot = path.join(__dirname, '..');

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  'http://127.0.0.1:5500,http://localhost:5500,http://localhost:3000,https://myronmurzello4.github.io'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      const isGitHubPagesOrigin = typeof origin === 'string' && origin.endsWith('.github.io');

      if (!origin || allowedOrigins.includes(origin) || isGitHubPagesOrigin) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  const isDatabaseReady = mongoose.connection.readyState === 1;
  res.status(isDatabaseReady ? 200 : 503).json({
    status: isDatabaseReady ? 'ok' : 'degraded',
    database: isDatabaseReady ? 'connected' : 'disconnected',
    message: isDatabaseReady ? 'API and database are ready' : 'API is running but MongoDB is unavailable',
  });
});

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      msg: 'Database unavailable. Start MongoDB on port 27017 or update MONGO_URI in server/.env.',
    });
  }

  return next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/cycles', require('./routes/cycles'));
app.use('/api/events', require('./routes/earn'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));

app.use(express.static(projectRoot));

app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  return res.sendFile(path.join(projectRoot, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

async function connectDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    await ensureDefaultData();
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);

    if (!reconnectTimer) {
      reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        await connectDatabase();
      }, 10000);
    }
  }
}

async function start() {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  await connectDatabase();
}

start();
