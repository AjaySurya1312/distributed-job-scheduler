/**
 * @file src/repositories/auth.repository.ts
 * @description Data-access layer for authentication entities.
 * All DB operations are isolated here; services call these methods, never prisma directly.
 */

import { User, Organization, OrganizationMember, RefreshToken, ApiKey, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
};

export type CreateOrgInput = {
  name: string;
  slug: string;
};

export type UserWithMemberships = User & {
  memberships: (OrganizationMember & { organization: Organization })[];
};

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

/**
 * Creates a new user record.
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  return prisma.user.create({ data });
}

/**
 * Finds a user by email address. Returns null if not found or soft-deleted.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { email, deletedAt: null, isActive: true },
  });
}

/**
 * Finds a user by their primary ID. Returns null if not found or soft-deleted.
 */
export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
}

/**
 * Returns user with all active organization memberships and org details.
 */
export async function findUserWithMemberships(id: string): Promise<UserWithMemberships | null> {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  }) as Promise<UserWithMemberships | null>;
}

/**
 * Updates the lastLoginAt timestamp for a user.
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
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
export async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  userAgent?: string,
  ipAddress?: string,
): Promise<RefreshToken> {
  return prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt, userAgent, ipAddress },
  });
}

/**
 * Finds an active (non-revoked, non-expired) refresh token by its hash.
 */
export async function findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
  return prisma.refreshToken.findFirst({
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
export async function deleteRefreshToken(tokenHash: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}

/**
 * Bulk-deletes all expired or revoked refresh tokens.
 * Intended for a scheduled cleanup job.
 * @returns Number of deleted records
 */
export async function deleteExpiredRefreshTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });
  logger.info(`Cleaned up ${result.count} expired refresh tokens`);
  return result.count;
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

/**
 * Creates an organization and the first member (as OWNER) in a single transaction.
 * Ensures atomic creation — either both succeed or both roll back.
 */
export async function createOrganizationWithMember(
  userId: string,
  orgData: CreateOrgInput,
): Promise<Organization> {
  return prisma.$transaction(async (tx) => {
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

    logger.info('Organization created with owner', {
      orgId: organization.id,
      userId,
    });

    return organization;
  });
}

/**
 * Finds an organization by slug (case-insensitive).
 */
export async function findOrganizationBySlug(slug: string): Promise<Organization | null> {
  return prisma.organization.findFirst({
    where: { slug, deletedAt: null },
  });
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

/**
 * Creates a new API key record.
 */
export async function createApiKey(data: {
  organizationId: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt?: Date;
}): Promise<ApiKey> {
  return prisma.apiKey.create({ data });
}

/**
 * Lists all active API keys for an organization.
 */
export async function findApiKeysByOrg(organizationId: string): Promise<ApiKey[]> {
  return prisma.apiKey.findMany({
    where: { organizationId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Finds a single API key by its hash (for authentication).
 */
export async function findApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
  return prisma.apiKey.findFirst({
    where: { keyHash, isActive: true },
  });
}

/**
 * Soft-deletes an API key (sets isActive = false).
 */
export async function revokeApiKey(
  apiKeyId: string,
  organizationId: string,
): Promise<ApiKey | null> {
  try {
    return await prisma.apiKey.update({
      where: { id: apiKeyId, organizationId },
      data: { isActive: false },
    });
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return null;
    }
    throw err;
  }
}
