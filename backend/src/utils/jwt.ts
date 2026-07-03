/**
 * @file src/utils/jwt.ts
 * @description JWT access and refresh token utilities.
 * Access tokens are short-lived (15m) signed JWTs.
 * Refresh tokens are long-lived (7d) opaque random strings stored hashed.
 */

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { UnauthorizedError } from './errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccessTokenPayload {
  sub: string;        // userId
  email: string;
  orgId: string;      // primary org context
  role: string;
  jti: string;        // unique token ID (for blacklisting)
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

// ---------------------------------------------------------------------------
// Access Token
// ---------------------------------------------------------------------------

/**
 * Signs a new access token with the given payload.
 * @param payload - Token payload (without iat/exp — added automatically)
 */
export function signAccessToken(
  payload: Omit<AccessTokenPayload, 'iat' | 'exp'>,
): { token: string; expiresAt: Date } {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as string,
    algorithm: 'HS256',
  };
  const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  // Calculate expiry date
  const decoded = jwt.decode(token) as JwtPayload;
  const expiresAt = new Date((decoded.exp as number) * 1000);
  return { token, expiresAt };
}

/**
 * Verifies and decodes an access token.
 * @throws UnauthorizedError if invalid or expired
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token has expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
}

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically secure opaque refresh token.
 * Returns both the raw token (sent to client) and its SHA-256 hash (stored in DB).
 */
export function generateRefreshToken(): {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Parse expiry from env (e.g., "7d" -> 7 days)
  const expiryStr = env.JWT_REFRESH_EXPIRES_IN;
  const match = expiryStr.match(/^(\d+)([dhms])$/);
  let expiresAt = new Date();
  if (match) {
    const [, num, unit] = match;
    const ms =
      unit === 'd'
        ? Number(num) * 86_400_000
        : unit === 'h'
        ? Number(num) * 3_600_000
        : unit === 'm'
        ? Number(num) * 60_000
        : Number(num) * 1_000;
    expiresAt = new Date(Date.now() + ms);
  }

  return { rawToken, tokenHash, expiresAt };
}

/**
 * Hashes a raw refresh token for safe DB storage / lookup.
 */
export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ---------------------------------------------------------------------------
// API Key
// ---------------------------------------------------------------------------

/**
 * Generates a new API key with a display prefix and its SHA-256 hash.
 * Returns the raw key (shown once to the user) and the hash (stored in DB).
 */
export function generateApiKey(prefix = 'sk'): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomPart = crypto.randomBytes(32).toString('hex');
  const rawKey = `${prefix}_${randomPart}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 12);
  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hashes an API key for lookup.
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// ---------------------------------------------------------------------------
// JTI
// ---------------------------------------------------------------------------

/**
 * Generates a unique JWT ID (jti) for access token blacklisting.
 */
export function generateJti(): string {
  return crypto.randomUUID();
}
