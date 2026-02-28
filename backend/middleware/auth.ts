import type { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { ApiError } from '../utils/http';

export interface AuthRequest extends Request {
  user?: { username: string };
}

const base64url = (input: Buffer | string) => Buffer.from(input).toString('base64url');

const parseExpiry = (exp: string) => {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 8 * 60 * 60;
  const value = Number(match[1]);
  const unit = match[2];
  if (unit === 's') return value;
  if (unit === 'm') return value * 60;
  if (unit === 'h') return value * 3600;
  return value * 86400;
};

const signToken = (payload: Record<string, unknown>, secret: string) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = base64url(crypto.createHmac('sha256', secret).update(unsigned).digest());
  return `${unsigned}.${signature}`;
};

const verifyToken = (token: string, secret: string) => {
  const parts = token.split('.');
  if (parts.length !== 3) throw new ApiError(401, 'Malformed token', 'UNAUTHORIZED');

  const [header, payload, signature] = parts;
  const expected = base64url(crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest());
  if (expected !== signature) throw new ApiError(401, 'Invalid token signature', 'UNAUTHORIZED');

  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { username: string; exp: number };
  if (Date.now() / 1000 > parsed.exp) throw new ApiError(401, 'Token expired', 'UNAUTHORIZED');
  return parsed;
};

export const issueToken = (username: string, expiresIn = '8h') => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ApiError(500, 'JWT_SECRET is not configured', 'CONFIG_ERROR');

  const ttl = parseExpiry(expiresIn);
  return signToken({ username, exp: Math.floor(Date.now() / 1000) + ttl }, secret);
};

export const requireAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) throw new ApiError(401, 'Missing bearer token', 'UNAUTHORIZED');

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ApiError(500, 'JWT_SECRET is not configured', 'CONFIG_ERROR');

  const decoded = verifyToken(token, secret);
  req.user = { username: decoded.username };
  next();
};
