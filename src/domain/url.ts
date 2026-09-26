export function parseHttpUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;

  const candidate = value.trim();
  if (candidate.length === 0 || !/^https?:\/\//i.test(candidate)) return null;

  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? candidate : null;
  } catch {
    return null;
  }
}
