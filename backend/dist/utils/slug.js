"use strict";
/**
 * @file src/utils/slug.ts
 * @description URL-safe slug generation utility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.uniquifySlug = uniquifySlug;
/**
 * Converts a string to a URL-safe slug.
 * Example: "My Queue Name" -> "my-queue-name"
 */
function generateSlug(text) {
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
function uniquifySlug(slug) {
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${slug}-${suffix}`;
}
//# sourceMappingURL=slug.js.map