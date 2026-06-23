export const DEFAULT_IMAGE = '/icon.png';

export function fallbackImageUrl(raw?: string | null): string {
  if (!raw) return DEFAULT_IMAGE;
  const str = raw.trim();
  if (!str) return DEFAULT_IMAGE;
  return str;
}
