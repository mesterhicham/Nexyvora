import { useEffect, useState } from 'react';
import api, { resolveAssetUrl } from '@/lib/api';

/**
 * Helpers for user-supplied file links (receipts, attachments, submissions).
 *
 * - Private files live behind the authenticated /api/upload/secure/:filename endpoint.
 *   <img src> and <a href> cannot send the JWT, so they are fetched with the API client
 *   and displayed through a short-lived blob: URL.
 * - Every other link goes through safeUrl(), which only lets http(s), blob and same-origin
 *   paths through. This neutralises javascript: / data: payloads (stored XSS).
 */

const SECURE_MARKER = '/upload/secure/';

export function secureFilename(url?: string | null): string | null {
  if (!url) return null;
  const idx = url.indexOf(SECURE_MARKER);
  if (idx === -1) return null;
  const name = url.slice(idx + SECURE_MARKER.length).split(/[?#]/)[0];
  return /^[A-Za-z0-9._-]+$/.test(name) ? name : null;
}

export function isSecureFileUrl(url?: string | null): boolean {
  return secureFilename(url) !== null;
}

export function safeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const value = String(url).trim();
  if (!value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return resolveAssetUrl(value);
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return resolveAssetUrl(value);
    if (parsed.protocol === 'blob:') return value;
  } catch {
    // Relative paths without a leading slash (e.g. "uploads/x.png")
    if (/^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(value)) return resolveAssetUrl(value);
  }
  return undefined;
}

async function fetchSecureBlobUrl(filename: string): Promise<string> {
  const res = await api.get(`/upload/secure/${encodeURIComponent(filename)}`, { responseType: 'blob' });
  return URL.createObjectURL(res.data as Blob);
}

/**
 * Open a file in a new tab. Private files are fetched with the JWT first.
 * The tab is opened synchronously so popup blockers do not interfere.
 */
export function openSecureFile(url?: string | null): void {
  const filename = secureFilename(url);
  if (!filename) {
    const href = safeUrl(url);
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  const tab = window.open('', '_blank');
  fetchSecureBlobUrl(filename)
    .then((blobUrl) => {
      if (tab) {
        tab.location.href = blobUrl;
      } else {
        window.location.href = blobUrl;
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    })
    .catch(() => {
      tab?.close();
    });
}

/** Resolve any file URL to something an <img> can display. */
export function useSecureFileUrl(url?: string | null): { src?: string; loading: boolean; error: boolean } {
  const filename = secureFilename(url);
  const [state, setState] = useState<{ src?: string; loading: boolean; error: boolean }>({
    src: filename ? undefined : safeUrl(url),
    loading: !!filename,
    error: false,
  });

  useEffect(() => {
    if (!filename) {
      setState({ src: safeUrl(url), loading: false, error: false });
      return;
    }
    let cancelled = false;
    let blobUrl: string | undefined;
    setState({ src: undefined, loading: true, error: false });
    fetchSecureBlobUrl(filename)
      .then((u) => {
        blobUrl = u;
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        setState({ src: u, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ src: undefined, loading: false, error: true });
      });
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [url, filename]);

  return state;
}
