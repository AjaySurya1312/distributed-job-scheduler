/**
 * @file src/utils/slug.ts
 * @description URL-safe slug generation utility.
 */

/**
 * Converts a string to a URL-safe slug.
 * Example: "My Queue Name" -> "my-queue-name"
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Appends a short random suffix to a slug to ensure uniqueness.
 * Example: "my-queue" -> "my-queue-a3f2"
 */
export function uniquifySlug(slug: string): string {
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
}
