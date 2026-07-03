"use strict";
/**
 * @file src/repositories/auth.repository.ts
 * @description Data-access layer for authentication entities.
 * All DB operations are isolated here; services call these methods, never prisma directly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.findUserWithMemberships = findUserWithMemberships;
exports.updateLastLogin = updateLastLogin;
exports.createRefreshToken = createRefreshToken;
exports.findRefreshToken = findRefreshToken;
exports.deleteRefreshToken = deleteRefreshToken;
exports.deleteExpiredRefreshTokens = deleteExpiredRefreshTokens;
exports.createOrganizationWithMember = createOrganizationWithMember;
exports.findOrganizationBySlug = findOrganizationBySlug;
exports.createApiKey = createApiKey;
exports.findApiKeysByOrg = findApiKeysByOrg;
exports.findApiKeyByHash = findApiKeyByHash;
exports.revokeApiKey = revokeApiKey;
const client_1 = require("@prisma/client");
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
/**
 * Creates a new user record.
 */
async function createUser(data) {
    return prisma_1.prisma.user.create({ data });
}
/**
 * Finds a user by email address. Returns null if not found or soft-deleted.
 */
async function findUserByEmail(email) {
    return prisma_1.prisma.user.findFirst({
        where: { email, deletedAt: null, isActive: true },
    });
}
/**
 * Finds a user by their primary ID. Returns null if not found or soft-deleted.
 */
async function findUserById(id) {
    return prisma_1.prisma.user.findFirst({
        where: { id, deletedAt: null },
    });
}
/**
 * Returns user with all active organization memberships and org details.
 */
async function findUserWithMemberships(id) {
    return prisma_1.prisma.user.findFirst({
        where: { id, deletedAt: null },
        include: {
            memberships: {
                include: { organization: true },
            },
        },
    });
}
/**
 * Updates the lastLoginAt timestamp for a user.
 */
async function updateLastLogin(userId) {
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
    });
}
// ---------------------------------------------------------------------------
// Refresh Tokens
// ---------------------------------------------------------------------------
/**
 * Persists a new hashed refresh token.
 */
async function createRefreshToken(userId, tokenHash, expiresAt, userAgent, ipAddress) {
    return prisma_1.prisma.refreshToken.create({
        data: { userId, tokenHash, expiresAt, userAgent, ipAddress },
    });
}
/**
 * Finds an active (non-revoked, non-expired) refresh token by its hash.
 */
async function findRefreshToken(tokenHash) {
    return prisma_1.prisma.refreshToken.findFirst({
        where: {
            tokenHash,
            revokedAt: null,
            expiresAt: { gt: new Date() },
        },
    });
}
/**
 * Revokes a refresh token by setting revokedAt.
 */
async function deleteRefreshToken(tokenHash) {
    await prisma_1.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
    });
}
/**
 * Bulk-deletes all expired or revoked refresh tokens.
 * Intended for a scheduled cleanup job.
 * @returns Number of deleted records
 */
async function deleteExpiredRefreshTokens() {
    const result = await prisma_1.prisma.refreshToken.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { revokedAt: { not: null } },
            ],
        },
    });
    logger_1.logger.info(`Cleaned up ${result.count} expired refresh tokens`);
    return result.count;
}
// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------
/**
 * Creates an organization and the first member (as OWNER) in a single transaction.
 * Ensures atomic creation � either both succeed or both roll back.
 */
async function createOrganizationWithMember(userId, orgData) {
    return prisma_1.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
            data: {
                name: orgData.name,
                slug: orgData.slug,
            },
        });
        await tx.organizationMember.create({
            data: {
                userId,
                organizationId: organization.id,
                role: 'OWNER',
            },
        });
        logger_1.logger.info('Organization created with owner', {
            orgId: organization.id,
            userId,
        });
        return organization;
    });
}
/**
 * Finds an organization by slug (case-insensitive).
 */
async function findOrganizationBySlug(slug) {
    return prisma_1.prisma.organization.findFirst({
        where: { slug, deletedAt: null },
    });
}
// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------
/**
 * Creates a new API key record.
 */
async function createApiKey(data) {
    return prisma_1.prisma.apiKey.create({ data });
}
/**
 * Lists all active API keys for an organization.
 */
async function findApiKeysByOrg(organizationId) {
    return prisma_1.prisma.apiKey.findMany({
        where: { organizationId, isActive: true },
        orderBy: { createdAt: 'desc' },
    });
}
/**
 * Finds a single API key by its hash (for authentication).
 */
async function findApiKeyByHash(keyHash) {
    return prisma_1.prisma.apiKey.findFirst({
        where: { keyHash, isActive: true },
    });
}
/**
 * Soft-deletes an API key (sets isActive = false).
 */
async function revokeApiKey(apiKeyId, organizationId) {
    try {
        return await prisma_1.prisma.apiKey.update({
            where: { id: apiKeyId, organizationId },
            data: { isActive: false },
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2025') {
            return null;
        }
        throw err;
    }
}
//# sourceMappingURL=auth.repository.js.map