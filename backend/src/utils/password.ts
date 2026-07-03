/**
 * @file src/utils/password.ts
 * @description Secure password hashing utilities using bcrypt, and
 * API key generation using cryptographically random bytes with SHA-256 hashing.
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../config/env';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of `generateApiKey`.
 * Store `hash` in the database; expose `key` to the user exactly once;
 * use `prefix` for display ("sk_live_ab12cd34efgh…").
 */
export interface ApiKeyResult {
  /**
   * The full raw API key — shown to the user exactly once at creation time.
   * Format: `sk_live_<32 random hex chars>`
   * Example: `sk_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`
   */
  key: string;

  /**
   * SHA-256 hash of the raw key — this is what gets stored in the database.
   * Never store the raw key; always verify by hashing the incoming key and
   * comparing to this value.
   */
  hash: string;

  /**
   * First 12 characters of the raw key for safe display in the UI.
   * Example: `sk_live_a1b2`
   */
  prefix: string;
}

// ---------------------------------------------------------------------------
// Password utilities
// ---------------------------------------------------------------------------

/**
 * Hashes a plaintext password using bcrypt with the configured number of rounds.
 * Higher rounds = more CPU time = stronger resistance to brute force.
 *
 * @param plain - The raw plaintext password from the user
 * @returns A bcrypt hash string (60 chars, includes salt)
 *
 * @example
 * const hash = await hashPassword(req.body.password);
 * await prisma.user.create({ data: { passwordHash: hash } });
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * Uses bcrypt's constant-time comparison to prevent timing attacks.
 *
 * @param plain - The raw plaintext password to verify
 * @param hash  - The stored bcrypt hash from the database
 * @returns `true` if the password matches, `false` otherwise
 *
 * @example
 * const valid = await comparePassword(req.body.password, user.passwordHash);
 * if (!valid) throw new AuthenticationError('Invalid credentials');
 */
export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// API key utilities
// ---------------------------------------------------------------------------

/**
 * Generates a new API key with a SHA-256 hash suitable for database storage.
 *
 * Security model:
 * - The raw `key` is shown to the user exactly once and never stored.
 * - The `hash` (SHA-256) is stored in the database and used for lookup.
 * - Incoming API keys are verified by: `sha256(incomingKey) === storedHash`.
 * - The `prefix` is stored for display ("Your key: sk_live_ab12cd34efgh…***").
 *
 * @returns `{ key, hash, prefix }`
 *
 * @example
 * const { key, hash, prefix } = generateApiKey();
 * await prisma.apiKey.create({
 *   data: { hash, prefix, name: 'My App', userId: req.user.id }
 * });
 * // Return `key` to the user in the response — it won't be retrievable later.
 */
export function generateApiKey(): ApiKeyResult {
  // 32 random bytes → 64 lowercase hex chars
  const randomPart = crypto.randomBytes(32).toString('hex');

  const key = `sk_live_${randomPart}`;

  // SHA-256 hex digest for database storage
  const hash = crypto.createHash('sha256').update(key).digest('hex');

  // First 12 chars of the full key for safe display (e.g. "sk_live_a1b2")
  const prefix = key.slice(0, 12);

  return { key, hash, prefix };
}

/**
 * Hashes an incoming API key (from the `X-API-Key` header) for database lookup.
 * Use this when verifying an API key provided by a caller.
 *
 * @param rawKey - The raw API key string from the request header
 * @returns SHA-256 hex digest
 *
 * @example
 * const hash = hashApiKey(req.headers['x-api-key'] as string);
 * const apiKey = await prisma.apiKey.findUnique({ where: { hash } });
 * if (!apiKey) throw new AuthenticationError('Invalid API key');
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}
