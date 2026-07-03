/**
 * @file src/utils/slug.ts
 * @description URL-safe slug generation utility.
 */
/**
 * Converts a string to a URL-safe slug.
 * Example: "My Queue Name" -> "my-queue-name"
 */
export declare function generateSlug(text: string): string;
/**
 * Appends a short random suffix to a slug to ensure uniqueness.
 * Example: "my-queue" -> "my-queue-a3f2"
 */
export declare function uniquifySlug(slug: string): string;
//# sourceMappingURL=slug.d.ts.map