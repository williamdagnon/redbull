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
import { testConnection, ensureConnection } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const disableJobs = (process.env.RAILWAY_DISABLE_JOBS === 'true') || (process.env.RAILWAY_DEBUG === 'true');

// Middleware - CORS Configuration
// Allow CORS from all origins - authentication is handled via JWT tokens
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
// Explicit CORS headers middleware (fallback) — ensures headers are present
app.use((req, res, next) => {
  try {
    const origin = req.headers.origin as string | undefined;
    const allowOrigin = process.env.FRONTEND_URL || origin || '*';
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    // Short-circuit OPTIONS
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  } catch (e) {
    // ignore
  }
  next();
});
// Capture raw body on JSON parse so payment callbacks can be signature-verified
app.use(express.json({
  verify: (req: any, res, buf: Buffer) => {
    if (buf && buf.length) req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  // Return DB status in health check (non-blocking but we await a quick check)
  try {
    const dbOk = await testConnection();
    res.json({ status: 'ok', db: dbOk ? 'ok' : 'unavailable', timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ status: 'error', db: 'unknown', error: err?.message || err });
  }
});

// Routes
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

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 APUIC Capital Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Ensure DB connection with retries before starting jobs
  (async () => {
    try {
      const dbAvailable = await ensureConnection(5, 1000);
      if (!disableJobs && dbAvailable) {
        try {
          startVIPEarningsJob();
          console.log('✅ VIP earnings job started');
        } catch (err: any) {
          console.error('⚠️ Cron job warning (non-fatal):', err?.message || err);
        }
      } else if (disableJobs) {
        console.log('⏸️ Cron jobs disabled (RAILWAY_DISABLE_JOBS/RAILWAY_DEBUG)');
      } else {
        console.warn('⏸️ Cron jobs skipped because DB is unavailable');
      }
    } catch (err: any) {
      console.error('⚠️ Error during DB availability check:', err?.message || err);
    }
  })();
});

export default app;
