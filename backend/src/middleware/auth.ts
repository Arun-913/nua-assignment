import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

interface JwtUserPayload extends JwtPayload {
  id: string,
}

declare global {
  namespace Express {
    interface Request {
      user: JwtUserPayload
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies['token']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if(typeof decoded === "string") {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = {
      id: decoded.userId,
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export default authMiddleware;