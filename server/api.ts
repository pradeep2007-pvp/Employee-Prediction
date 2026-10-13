import express from 'express';
import cors from 'cors';
import { MongoClient, Db } from 'mongodb';
import { getSecret } from './middleware/auth';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import predictionRoutes from './routes/predictions';
import metricsRoutes from './routes/metrics';

declare global {
  var db: Db;
}

let connecting: Promise<void> | null = null;

async function ensureConnected() {
  if (global.db) return;
  if (!connecting) {
    connecting = (async () => {
      const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
      const dbName = process.env.MONGODB_DB || 'hr_dataminer';
      console.log('Connecting to MongoDB:', uri.replace(/\/\/[^@]+@/, '//***:***@'));
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
      global.db = client.db(dbName);
      await global.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await global.db.collection('employees').createIndex({ user_id: 1 });
      await global.db.collection('predictions').createIndex({ user_id: 1 });
      await global.db.collection('model_metrics').createIndex({ user_id: 1 });
      console.log('MongoDB connected:', dbName);
    })();
  }
  await connecting;
}

export async function createApiApp() {
  await ensureConnected();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/predictions', predictionRoutes);
  app.use('/api/metrics', metricsRoutes);
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}

export { getSecret };
