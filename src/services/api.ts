import type { CollectionsResponse } from '../types/collection';

const API_BASE = 'https://staging-apis-v2.oono.ai/api/public';
const APP_TOKEN =
  import.meta.env.VITE_APP_TOKEN ??
  '9f8e7d6c5b4a3e2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f';

const MEDIA_BASE = 'https://media.oono.ai/uploads';

/** Returns true if cover is a color (hex, rgb, rgba) rather than an image path/URL */
export function isCoverColor(cover: string): boolean {
  if (!cover || typeof cover !== 'string') return false;
  const trimmed = cover.trim();
  return (
    trimmed.startsWith('#') ||
    trimmed.startsWith('rgb(') ||
    trimmed.startsWith('rgba(')
  );
}

export function getCoverImageUrl(cover: string): string {
  if (!cover) return '';
  if (isCoverColor(cover)) return '';
  if (cover.startsWith('http://') || cover.startsWith('https://')) {
    return cover;
  }
  const path = cover.startsWith('/') ? cover.slice(1) : cover;
  return `${MEDIA_BASE}/${path}`;
}

export async function getStoriesCollection(
  slug: string
): Promise<CollectionsResponse> {
  const url = `${API_BASE}/stories-collection/?slug=${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    headers: {
      'App-Token': APP_TOKEN,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<CollectionsResponse>;
}
