/**
 * @file src/utils/jwt.ts
 * @description JWT access and refresh token utilities.
 * Access tokens are short-lived (15m) signed JWTs.
 * Refresh tokens are long-lived (7d) opaque random strings stored hashed.
 */
export interface AccessTokenPayload {
    sub: string;
    email: string;
    orgId: string;
    role: string;
    jti: string;
    iat?: number;
    exp?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
}
/**
 * Signs a new access token with the given payload.
 * @param payload - Token payload (without iat/exp � added automatically)
 */
export declare function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): {
    token: string;
    expiresAt: Date;
};
/**
 * Verifies and decodes an access token.
 * @throws UnauthorizedError if invalid or expired
 */
export declare function verifyAccessToken(token: string): AccessTokenPayload;
/**
 * Generates a cryptographically secure opaque refresh token.
 * Returns both the raw token (sent to client) and its SHA-256 hash (stored in DB).
 */
export declare function generateRefreshToken(): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
};
/**
 * Hashes a raw refresh token for safe DB storage / lookup.
 */
export declare function hashRefreshToken(rawToken: string): string;
/**
 * Generates a new API key with a display prefix and its SHA-256 hash.
 * Returns the raw key (shown once to the user) and the hash (stored in DB).
 */
export declare function generateApiKey(prefix?: string): {
    rawKey: string;
    keyHash: string;
    keyPrefix: string;
};
/**
 * Hashes an API key for lookup.
 */
export declare function hashApiKey(rawKey: string): string;
/**
 * Generates a unique JWT ID (jti) for access token blacklisting.
 */
export declare function generateJti(): string;
//# sourceMappingURL=jwt.d.ts.map