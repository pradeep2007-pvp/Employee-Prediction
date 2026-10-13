import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'hr-dataminer-dev-secret';
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: string; email: string };
    (req as any).userId = payload.userId;
    (req as any).email = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function getSecret(): string {
  return getJwtSecret();
}
