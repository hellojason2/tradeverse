import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '@config/env.js';
import type { JwtPayload, UserRole } from '@/contracts/auth.js';

export function signAccessToken(userId: string, email: string, role: UserRole, sessionId: string): string {
  return jwt.sign(
    { sub: userId, id: userId, email, role, type: 'access', sessionId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY } as SignOptions,
  );
}

export function signRefreshToken(userId: string, email: string, role: UserRole, sessionId: string): string {
  return jwt.sign(
    { sub: userId, id: userId, email, role, type: 'refresh', sessionId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY } as SignOptions,
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET, { clockTolerance: 60 }) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { clockTolerance: 60 }) as JwtPayload;
}

export function getTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token) as { exp: number } | null;
  if (!decoded?.exp) {
    throw new Error('Invalid token: no exp claim');
  }
  return new Date(decoded.exp * 1000);
}
