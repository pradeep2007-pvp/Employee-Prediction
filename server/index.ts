import express from 'express';
import cors from 'cors';
import { MongoClient, Db } from 'mongodb';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import predictionRoutes from './routes/predictions';
import metricsRoutes from './routes/metrics';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'hr_dataminer';
const PORT = process.env.PORT || 3001;

declare global {
  var db: Db;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  global.db = client.db(DB_NAME);

  await global.db.collection('users').createIndex({ email: 1 }, { unique: true });
  await global.db.collection('employees').createIndex({ user_id: 1 });
  await global.db.collection('predictions').createIndex({ user_id: 1 });
  await global.db.collection('model_metrics').createIndex({ user_id: 1 });

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/predictions', predictionRoutes);
  app.use('/api/metrics', metricsRoutes);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
