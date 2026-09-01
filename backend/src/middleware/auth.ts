import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/config';

export interface AuthRequest extends Request {
  userId?: string;
  isGuest?: boolean;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      // Allow guest access - mark as guest user
      req.isGuest = true;
      return next();
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as { userId: string };

    req.userId = decoded.userId;
    req.isGuest = false;
    next();
  } catch (error) {
    // If token is invalid, allow as guest
    req.isGuest = true;
    next();
  }
};

