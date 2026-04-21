import { randomBytes } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@config/prisma.js';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '@services/jwtService.js';
import { hashPassword, comparePassword } from '@utils/password.js';
import { DomainError, ValidationError } from '@/types/errors.js';
import type {
  AuthenticatedUser,
} from '@/contracts/auth.js';
import type {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  LogoutRequest,
} from '@/contracts/routes.js';

function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

function toAuthenticatedUser(user: { id: string; email: string; role: string }): AuthenticatedUser {
  return { id: user.id, email: user.email, role: user.role as AuthenticatedUser['role'] };
}

export async function register(req: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) {
  const { email, password, confirmPassword, acceptedTerms, referralCode: referredByCode } = req.body;

  if (!acceptedTerms) {
    throw new ValidationError('Terms must be accepted', { acceptedTerms: 'You must accept the terms' });
  }
  if (password !== confirmPassword) {
    throw new ValidationError('Passwords do not match', { confirmPassword: 'Passwords must match' });
  }
  if (password.length < 8) {
    throw new ValidationError('Password too short', { password: 'Minimum 8 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new DomainError('USER_STATE', 'Email already registered');
  }

  const passwordHash = await hashPassword(password);
  const referralCode = generateReferralCode();

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      referralCode,
      referredByCode: referredByCode || null,
    },
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: '', // updated after token creation
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const accessToken = signAccessToken(user.id, user.email, user.role, session.id);
  const refreshToken = signRefreshToken(user.id, user.email, user.role, session.id);

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: refreshToken },
  });

  reply.status(201).send({
    data: {
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  });
}

export async function login(req: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
  const { identifier, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { phone: identifier },
      ],
    },
  });

  if (!user) {
    throw new DomainError('USER_INPUT', 'Invalid credentials');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new DomainError('USER_INPUT', 'Invalid credentials');
  }

  if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
    throw new DomainError('USER_STATE', 'Account suspended');
  }

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const accessToken = signAccessToken(user.id, user.email, user.role, session.id);
  const refreshToken = signRefreshToken(user.id, user.email, user.role, session.id);

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: refreshToken },
  });

  reply.send({
    data: {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.name || user.email.split('@')[0],
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        kycStatus: user.kycStatus,
      },
    },
  });
}

export async function refresh(req: FastifyRequest<{ Body: RefreshRequest }>, reply: FastifyReply) {
  const { refreshToken } = req.body;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new DomainError('USER_INPUT', 'Invalid refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new DomainError('USER_INPUT', 'Invalid token type');
  }

  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new DomainError('USER_STATE', 'Session expired or revoked');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new DomainError('USER_STATE', 'User not found');
  }

  // Token rotation: invalidate old session, create new one
  await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });

  const newSession = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: '',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const newAccessToken = signAccessToken(user.id, user.email, user.role, newSession.id);
  const newRefreshToken = signRefreshToken(user.id, user.email, user.role, newSession.id);

  await prisma.session.update({
    where: { id: newSession.id },
    data: { refreshTokenHash: newRefreshToken },
  });

  reply.send({
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  });
}

export async function logout(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) {
    reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }

  const { allSessions } = req.body as { allSessions?: boolean };

  if (allSessions) {
    await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } else {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        await prisma.session.updateMany({
          where: { id: payload.sessionId, userId: user.id },
          data: { revokedAt: new Date() },
        });
      } catch {
        // If access token doesn't have sessionId, fallback to user-level logout
        await prisma.session.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    }
  }

  reply.send({ data: { success: true } });
}

export async function me(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!user) {
    reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    reply.status(404).send({ success: false, error: { code: 'USER_STATE', message: 'User not found' } });
    return;
  }

  reply.send({
    data: {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.displayName || dbUser.name || dbUser.email.split('@')[0],
      avatarUrl: dbUser.avatarUrl,
      role: dbUser.role,
      status: dbUser.status,
      kycStatus: dbUser.kycStatus,
      phone: dbUser.phone,
      referralCode: dbUser.referralCode,
      twoFaEnabled: dbUser.twoFaEnabled,
      createdAt: dbUser.createdAt.toISOString(),
      emailVerifiedAt: dbUser.emailVerifiedAt?.toISOString() || null,
    },
  });
}
