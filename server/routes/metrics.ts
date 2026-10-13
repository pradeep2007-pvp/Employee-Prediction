import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const metrics = await global.db
    .collection('model_metrics')
    .find({ user_id: userId })
    .sort({ trained_at: -1 })
    .toArray();
  res.json(metrics);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  await global.db.collection('model_metrics').deleteMany({ user_id: userId });
  const docs = (Array.isArray(req.body) ? req.body : [req.body]).map((m: any) => ({
    ...m,
    user_id: userId,
  }));
  const result = await global.db.collection('model_metrics').insertMany(docs);
  res.status(201).json({ insertedCount: result.insertedCount });
});

export default router;
