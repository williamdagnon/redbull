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

/* ================================
   🔴 PORT RAILWAY – OBLIGATOIRE
================================= */
const PORT = process.env.PORT;

if (!PORT) {
  console.error('❌ ERROR: process.env.PORT is not defined');
  process.exit(1);
}

/* ================================
   🟡 CORS CONFIGURATION
================================= */
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Autorise toutes les origines Railway + Localhost
    if (!origin) return callback(null, true);

    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://tender-charm-production-865b.up.railway.app'
    ];

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Autorise tous pour l’instant (dev)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

/* ================================
   🟢 MIDDLEWARES
================================= */
app.use(cors(corsOptions));

// Répond correctement aux requêtes OPTIONS (preflight)
app.options('*', cors(corsOptions));

app.use(express.json({
  verify: (req: any, res, buf: Buffer) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));

app.use(express.urlencoded({ extended: true }));

// Sécurité CORS supplémentaire (fallback)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin,Content-Type,Accept,Authorization,X-Requested-With'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

/* ================================
   🔵 HEALTH CHECK
================================= */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'APUIC Capital Backend',
    timestamp: new Date().toISOString()
  });
});

/* ================================
   🔵 ROUTES
================================= */
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

/* ================================
   🔴 ERROR HANDLER
================================= */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ API ERROR:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

/* ================================
   🟢 SERVER START
================================= */
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 API RUNNING ON PORT: ${PORT}`);
  console.log(`🌍 ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // NON BLOQUANT (ne peut plus casser ton serveur)
  setTimeout(() => {

    testConnection()
      .then(() => console.log('✅ Database connected'))
      .catch(err => console.error('⚠️ Database warning:', err.message));

    try {
      startVIPEarningsJob();
      console.log('✅ VIP job started');
    } catch (err: any) {
      console.error('⚠️ VIP job warning:', err.message);
    }

  }, 3000);
});

export default app;
