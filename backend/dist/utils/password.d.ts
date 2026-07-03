/**
 * @file src/utils/password.ts
 * @description Secure password hashing utilities using bcrypt, and
 * API key generation using cryptographically random bytes with SHA-256 hashing.
 */
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
export declare function hashPassword(plain: string): Promise<string>;
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
export declare function comparePassword(plain: string, hash: string): Promise<boolean>;
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
export declare function generateApiKey(): ApiKeyResult;
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
export declare function hashApiKey(rawKey: string): string;
//# sourceMappingURL=password.d.ts.map