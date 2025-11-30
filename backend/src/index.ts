import express from 'express';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import setupRoutes from './routes/setup.routes';
import vipRoutes from './routes/vip.routes';
import depositRoutes from './routes/deposit.routes';
import withdrawalRoutes from './routes/withdrawal.routes';
import walletRoutes from './routes/wallet.routes';
import adminRoutes from './routes/admin.routes';
import rechargeRoutes from './routes/recharge.routes';
import inpayRoutes from './routes/inpay.routes';
import giftRoutes from './routes/gift.routes';

import { startVIPEarningsJob } from './jobs/vip-earnings.job';
import { testConnection } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ----------------------
// CORS Configuration
// ----------------------
const allowedOrigins = [
  'https://tender-charm-production-865b.up.railway.app',
  'http://localhost:3000' // pour tests locaux
];

// Middleware CORS dynamique
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
  }

  // Preflight requests doivent répondre 200
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ----------------------
// Middleware pour JSON
// ----------------------
app.use(express.json({
  verify: (req: any, res, buf: Buffer) => {
    if (buf && buf.length) req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true }));

// ----------------------
// Health check
// ----------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----------------------
// Routes
// ----------------------
app.use('/api/auth', authRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/inpay', inpayRoutes);
app.use('/api/gift', giftRoutes);

// ----------------------
// Error handler
// ----------------------
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ----------------------
// Start server
// ----------------------
app.listen(PORT, async () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Test database connection
  await testConnection();

  // Start VIP cron jobs
  startVIPEarningsJob();
});

export default app;
