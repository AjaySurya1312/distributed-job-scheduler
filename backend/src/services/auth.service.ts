import { User, RefreshToken, ApiKey } from '@prisma/client';
import { prisma } from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  async register(data: any): Promise<{ user: User, token: string }> {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      } as any
    });

    const token = this.generateToken(user.id);
    return { user, token };
  }

  async login(data: any): Promise<{ user: User, token: string, refreshToken: string }> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id);
    const refreshToken = await this.createRefreshToken(user.id);

    return { user, token, refreshToken: refreshToken.token };
  }

  async refreshToken(tokenStr: string): Promise<{ token: string, refreshToken: string }> {
    const refreshToken = await prisma.refreshToken.findUnique({ where: { token: tokenStr }, include: { user: true } as any });
    
    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    const newToken = this.generateToken(refreshToken.userId);
    const newRefreshToken = await this.createRefreshToken(refreshToken.userId);

    await prisma.refreshToken.delete({ where: { id: refreshToken.id } });

    return { token: newToken, refreshToken: newRefreshToken.token };
  }

  async logout(tokenStr: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token: tokenStr } });
  }

  async me(userId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  async createApiKey(userId: string, projectId: string, name: string): Promise<ApiKey> {
    const key = crypto.randomBytes(32).toString('hex');
    return prisma.apiKey.create({
      data: {
        key,
        name,
        userId,
        projectId
      } as any
    });
  }

  async revokeApiKey(id: string): Promise<void> {
    await prisma.apiKey.delete({ where: { id } });
  }

  private generateToken(userId: string): string {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  private async createRefreshToken(userId: string): Promise<RefreshToken> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);
    return prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt
      } as any
    });
  }
}

export const authService = new AuthService();
