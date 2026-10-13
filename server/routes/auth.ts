import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = global.db;
  const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const result = await db.collection('users').insertOne({
    email: email.toLowerCase(),
    password: hashed,
    created_at: new Date().toISOString(),
  });

  const token = jwt.sign({ userId: result.insertedId.toString(), email: email.toLowerCase() }, JWT_SECRET);
  res.status(201).json({
    token,
    user: { id: result.insertedId.toString(), email: email.toLowerCase() },
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = global.db;
  const user = await db.collection('users').findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET);
  res.json({
    token,
    user: { id: user._id.toString(), email: user.email },
  });
});

router.get('/me', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string; email: string };
    res.json({ id: payload.userId, email: payload.email });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
