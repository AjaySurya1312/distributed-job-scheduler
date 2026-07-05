import { User, RefreshToken, ApiKey } from '@prisma/client';
import { prisma } from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  async register(data: any): Promise<any> {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const firstName = data.firstName || 'Unknown';
    const lastName = data.lastName || '';
    const orgName = data.organizationName || `${firstName}'s Org`;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        memberships: {
          create: {
            role: 'OWNER',
            organization: {
              create: {
                name: orgName,
                slug: `${firstName.toLowerCase()}-org-${crypto.randomBytes(4).toString('hex')}`,
              }
            }
          }
        }
      },
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });

    const accessToken = this.generateToken(user.id);
    const { rawToken: refreshToken } = await this.createRefreshToken(user.id);
    
    // JWT_EXPIRES_IN is '15m' = 900 seconds
    const expiresIn = 900; 
    
    // Extract organization from created user
    const organization = user.memberships[0]?.organization || null;

    return { 
      user, 
      organization,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn
      } 
    };
  }

  async login(data: any): Promise<any> {
    const user = await prisma.user.findUnique({ 
      where: { email: data.email },
      include: {
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });
    
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateToken(user.id);
    const { rawToken: refreshToken } = await this.createRefreshToken(user.id);
    const expiresIn = 900;
    
    const organization = user.memberships[0]?.organization || null;

    return { 
      user, 
      organization,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn
      }
    };
  }

  async refreshToken(tokenStr: string): Promise<{ token: string, refreshToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(tokenStr).digest('hex');
    const refreshToken = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    
    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    const newToken = this.generateToken(refreshToken.userId);
    const newRefreshToken = await this.createRefreshToken(refreshToken.userId);

    await prisma.refreshToken.delete({ where: { id: refreshToken.id } });

    return { token: newToken, refreshToken: newRefreshToken.rawToken };
  }

  async logout(tokenStr: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(tokenStr).digest('hex');
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async me(userId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id: userId } });
  }

  async createApiKey(userId: string, projectId: string, name: string): Promise<ApiKey> {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const key = `sk_live_${rawKey}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const prefix = key.slice(0, 12);

    return prisma.apiKey.create({
      data: {
        keyHash: hash,
        keyPrefix: prefix,
        name,
        userId,
        organizationId: projectId // assuming projectId maps to organizationId? Wait, the model expects organizationId
      }
    });
  }

  async revokeApiKey(id: string): Promise<void> {
    await prisma.apiKey.delete({ where: { id } });
  }

  private generateToken(userId: string): string {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  private async createRefreshToken(userId: string): Promise<{ record: RefreshToken, rawToken: string }> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);
    const record = await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt
      }
    });
    return { record, rawToken };
  }
}

export const authService = new AuthService();
