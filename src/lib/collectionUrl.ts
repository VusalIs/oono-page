import type { Collection } from '../types/collection';

/** Slugify name for URL: lowercase, replace non-alphanumeric with dash. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build shareable c param from collection (code + title style like staging).
 * e.g. "uTC-Relax" or "Relax-abc123" if no code.
 */
export function buildCollectionParam(collection: Collection): string {
  const nameSlug = slugify(collection.name);
  if (collection.code) {
    return `${collection.code}-${nameSlug}`;
  }
  return `${nameSlug}-${collection.collectionId.slice(-8)}`;
}

/** Find collection from list whose c param matches. */
export function findCollectionByParam(
  collections: Collection[],
  c: string
): Collection | undefined {
  return collections.find((col) => buildCollectionParam(col) === c);
}
