const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { ensureDefaultData } = require('./utils/seed');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://127.0.0.1:5500,http://localhost:5500,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.send('Urban Oasis API is running');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/cycles', require('./routes/cycles'));
app.use('/api/events', require('./routes/earn'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

async function start() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing');
    }

    await mongoose.connect(process.env.MONGO_URI);
    await ensureDefaultData();

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
