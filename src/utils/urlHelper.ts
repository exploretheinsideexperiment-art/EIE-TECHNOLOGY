/**
 * URL resolution helper for EIE-Technology payment portal.
 * Correctly detects and preserves:
 * - GitHub Pages repository subpaths (e.g. https://username.github.io/repository-name/)
 * - Custom domains and subpaths
 * - Local development and Cloud Run preview hosts
 */

export function getAppBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://pay.eie-technology.com/';
  }

  const { origin, pathname } = window.location;

  // Strip file names like index.html, 404.html, or any file with an extension
  let cleanPath = pathname.replace(/\/[^/]+\.[a-zA-Z0-9]+$/i, '');

  // Ensure cleanPath ends with a slash
  if (!cleanPath.endsWith('/')) {
    cleanPath += '/';
  }

  return `${origin}${cleanPath}`;
}

export function buildPaymentPortalUrl(resourceId: string, revision?: number, customBase?: string): string {
  const base = customBase && customBase.trim() ? customBase.trim() : getAppBaseUrl();
  try {
    const parsed = new URL(base.startsWith('http') ? base : `https://${base}`);
    parsed.searchParams.set('pay', resourceId);
    if (revision) {
      parsed.searchParams.set('rev', String(revision));
    }
    return parsed.toString();
  } catch {
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return `${cleanBase}?pay=${encodeURIComponent(resourceId)}${revision ? `&rev=${revision}` : ''}`;
  }
}

export function buildAccessUrl(rawToken: string, customBase?: string): string {
  const base = customBase && customBase.trim() ? customBase.trim() : getAppBaseUrl();
  try {
    const parsed = new URL(base.startsWith('http') ? base : `https://${base}`);
    parsed.searchParams.set('token', rawToken);
    return parsed.toString();
  } catch {
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return `${cleanBase}?token=${encodeURIComponent(rawToken)}`;
  }
}
