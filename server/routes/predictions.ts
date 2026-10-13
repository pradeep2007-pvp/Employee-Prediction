import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const predictions = await global.db
    .collection('predictions')
    .find({ user_id: userId })
    .sort({ created_at: -1 })
    .toArray();
  res.json(predictions);
});

router.post('/', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const doc = {
    ...req.body,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  const result = await global.db.collection('predictions').insertOne(doc);
  res.status(201).json({ ...doc, _id: result.insertedId, id: result.insertedId.toString() });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { id } = req.params;
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

  const result = await global.db.collection('predictions').deleteOne({ _id: new ObjectId(id), user_id: userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Prediction not found' });
  res.json({ success: true });
});

export default router;
