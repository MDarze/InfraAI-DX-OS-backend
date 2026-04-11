import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { ok } from '../../utils/response';

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

function signAccess(userId: string, email: string, role: string) {
  return jwt.sign({ sub: userId, email, role }, env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
}

function signRefresh() {
  return uuidv4();
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid credentials');

    const accessToken = signAccess(user.id, user.email, user.role);
    const refreshToken = signRefresh();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
      },
    });

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    ok(res, {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    if (!stored.user.isActive) throw new AppError(401, 'Account disabled');

    // rotate token
    const newRefresh = signRefresh();
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: stored.id } }),
      prisma.refreshToken.create({
        data: {
          token: newRefresh,
          userId: stored.userId,
          expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
        },
      }),
    ]);

    const accessToken = signAccess(stored.user.id, stored.user.email, stored.user.role);
    ok(res, { accessToken, refreshToken: newRefresh });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    ok(res, { message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}
