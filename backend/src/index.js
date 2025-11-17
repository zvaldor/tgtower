import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import bot, { setupWebhook, processUpdate } from './bot/index.js';
import { initializeCronJobs } from './utils/cronJobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Routes
app.use('/api', apiRoutes);

// Telegram webhook endpoint
app.post('/webhook/telegram', (req, res) => {
  try {
    processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Tower Build API',
    version: '1.0.0',
    status: 'running',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Bot username: @${process.env.BOT_TOKEN?.split(':')[0] || 'unknown'}`);
  console.log(`🌐 WebApp URL: ${process.env.WEBAPP_URL}`);

  // Set up webhook
  const webhookUrl = process.env.WEBHOOK_URL || `https://tgtower-production.up.railway.app`;
  await setupWebhook(webhookUrl);

  // Initialize cron jobs
  initializeCronJobs();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
