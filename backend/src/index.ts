import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS basique pour test
app.use(cors({
  origin: true,
  credentials: true,
}));

// Middleware JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  const dbOk = await testConnection();
  res.json({ status: 'ok', dbConnection: dbOk, timestamp: new Date().toISOString() });
});

// Routes de test (peuvent être commentées pour ce test)
app.get('/', (req, res) => res.send('Server is running'));

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`🚀 Minimal backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
