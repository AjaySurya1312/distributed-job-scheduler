/**
 * @file src/repositories/auth.repository.ts
 * @description Data-access layer for authentication entities.
 * All DB operations are isolated here; services call these methods, never prisma directly.
 */
import { User, Organization, OrganizationMember, RefreshToken, ApiKey } from '@prisma/client';
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
    memberships: (OrganizationMember & {
        organization: Organization;
    })[];
};
/**
 * Creates a new user record.
 */
export declare function createUser(data: CreateUserInput): Promise<User>;
/**
 * Finds a user by email address. Returns null if not found or soft-deleted.
 */
export declare function findUserByEmail(email: string): Promise<User | null>;
/**
 * Finds a user by their primary ID. Returns null if not found or soft-deleted.
 */
export declare function findUserById(id: string): Promise<User | null>;
/**
 * Returns user with all active organization memberships and org details.
 */
export declare function findUserWithMemberships(id: string): Promise<UserWithMemberships | null>;
/**
 * Updates the lastLoginAt timestamp for a user.
 */
export declare function updateLastLogin(userId: string): Promise<void>;
/**
 * Persists a new hashed refresh token.
 */
export declare function createRefreshToken(userId: string, tokenHash: string, expiresAt: Date, userAgent?: string, ipAddress?: string): Promise<RefreshToken>;
/**
 * Finds an active (non-revoked, non-expired) refresh token by its hash.
 */
export declare function findRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
/**
 * Revokes a refresh token by setting revokedAt.
 */
export declare function deleteRefreshToken(tokenHash: string): Promise<void>;
/**
 * Bulk-deletes all expired or revoked refresh tokens.
 * Intended for a scheduled cleanup job.
 * @returns Number of deleted records
 */
export declare function deleteExpiredRefreshTokens(): Promise<number>;
/**
 * Creates an organization and the first member (as OWNER) in a single transaction.
 * Ensures atomic creation � either both succeed or both roll back.
 */
export declare function createOrganizationWithMember(userId: string, orgData: CreateOrgInput): Promise<Organization>;
/**
 * Finds an organization by slug (case-insensitive).
 */
export declare function findOrganizationBySlug(slug: string): Promise<Organization | null>;
/**
 * Creates a new API key record.
 */
export declare function createApiKey(data: {
    organizationId: string;
    userId: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
    scopes: string[];
    expiresAt?: Date;
}): Promise<ApiKey>;
/**
 * Lists all active API keys for an organization.
 */
export declare function findApiKeysByOrg(organizationId: string): Promise<ApiKey[]>;
/**
 * Finds a single API key by its hash (for authentication).
 */
export declare function findApiKeyByHash(keyHash: string): Promise<ApiKey | null>;
/**
 * Soft-deletes an API key (sets isActive = false).
 */
export declare function revokeApiKey(apiKeyId: string, organizationId: string): Promise<ApiKey | null>;
//# sourceMappingURL=auth.repository.d.ts.map