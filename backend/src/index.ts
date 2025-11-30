import express from 'express';
import cors from 'cors';
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

/* ✅ FIX IMPORTANT FOR RAILWAY */
const PORT = Number(process.env.PORT);

/* ✅ LOG to check if file is executed */
console.log('🚨 SERVER FILE LOADED');

/* ✅ CORS - proper clean version */
const corsOptions = {
  origin: [
    'https://tender-charm-production-865b.up.railway.app', // frontend railway
    process.env.FRONTEND_URL || ''
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

/* ✅ Handle preflight properly */
app.options('*', cors(corsOptions));

/* ✅ Body parsers */
app.use(express.json({
  verify: (req: any, res, buf: Buffer) => {
    if (buf && buf.length) req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true }));

/* ✅ Health check */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/* ✅ Routes */
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

/* ✅ Error handler */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

/* ✅ START SERVER (Railway ready) */
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  /* ✅ Database test — non blocking */
  try {
    await testConnection();
    console.log('✅ Database connected');
  } catch (err: any) {
    console.error('⚠️ Database warning:', err.message);
  }

  /* ✅ Cron */
  try {
    startVIPEarningsJob();
    console.log('✅ VIP earnings job started');
  } catch (err: any) {
    console.error('⚠️ Cron warning:', err.message);
  }
});

export default app;
