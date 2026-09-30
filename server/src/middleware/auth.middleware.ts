import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createAppError } from '../utils/app-error';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createAppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header. Please provide a Bearer token.'));
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    return next(createAppError(401, 'UNAUTHORIZED', 'Bearer token cannot be empty'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
    (req as any).user = {
      userId: payload.userId,
      email: payload.email,
    };
    next();
  } catch (error) {
    return next(createAppError(401, 'INVALID_TOKEN', 'Session has expired or token is invalid. Please log in again.'));
  }
}
