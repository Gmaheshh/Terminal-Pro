import type { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = 'API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`, 'NOT_FOUND'));
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  const message = err instanceof Error ? err.message : 'Unexpected server error';
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message
    }
  });
};
