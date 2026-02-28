import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/http';

const requests = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (limit = 120, windowMs = 60_000) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const bucket = requests.get(key);

    if (!bucket || now > bucket.resetAt) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > limit) {
      throw new ApiError(429, 'Rate limit exceeded. Please try again shortly.', 'RATE_LIMITED');
    }

    next();
  };
};
