"use strict";
/**
 * @file src/utils/jwt.ts
 * @description JWT access and refresh token utilities.
 * Access tokens are short-lived (15m) signed JWTs.
 * Refresh tokens are long-lived (7d) opaque random strings stored hashed.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.hashRefreshToken = hashRefreshToken;
exports.generateApiKey = generateApiKey;
exports.hashApiKey = hashApiKey;
exports.generateJti = generateJti;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const errors_1 = require("./errors");
// ---------------------------------------------------------------------------
// Access Token
// ---------------------------------------------------------------------------
/**
 * Signs a new access token with the given payload.
 * @param payload - Token payload (without iat/exp � added automatically)
 */
function signAccessToken(payload) {
    const options = {
        expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN,
        algorithm: 'HS256',
    };
    const token = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, options);
    // Calculate expiry date
    const decoded = jsonwebtoken_1.default.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    return { token, expiresAt };
}
/**
 * Verifies and decodes an access token.
 * @throws UnauthorizedError if invalid or expired
 */
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.UnauthorizedError('Access token has expired');
        }
        throw new errors_1.UnauthorizedError('Invalid access token');
    }
}
// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------
/**
 * Generates a cryptographically secure opaque refresh token.
 * Returns both the raw token (sent to client) and its SHA-256 hash (stored in DB).
 */
function generateRefreshToken() {
    const rawToken = crypto_1.default.randomBytes(64).toString('hex');
    const tokenHash = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
    // Parse expiry from env (e.g., "7d" -> 7 days)
    const expiryStr = env_1.env.JWT_REFRESH_EXPIRES_IN;
    const match = expiryStr.match(/^(\d+)([dhms])$/);
    let expiresAt = new Date();
    if (match) {
        const [, num, unit] = match;
        const ms = unit === 'd'
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
function hashRefreshToken(rawToken) {
    return crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
}
// ---------------------------------------------------------------------------
// API Key
// ---------------------------------------------------------------------------
/**
 * Generates a new API key with a display prefix and its SHA-256 hash.
 * Returns the raw key (shown once to the user) and the hash (stored in DB).
 */
function generateApiKey(prefix = 'sk') {
    const randomPart = crypto_1.default.randomBytes(32).toString('hex');
    const rawKey = `${prefix}_${randomPart}`;
    const keyHash = crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);
    return { rawKey, keyHash, keyPrefix };
}
/**
 * Hashes an API key for lookup.
 */
function hashApiKey(rawKey) {
    return crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
}
// ---------------------------------------------------------------------------
// JTI
// ---------------------------------------------------------------------------
/**
 * Generates a unique JWT ID (jti) for access token blacklisting.
 */
function generateJti() {
    return crypto_1.default.randomUUID();
}
//# sourceMappingURL=jwt.js.map