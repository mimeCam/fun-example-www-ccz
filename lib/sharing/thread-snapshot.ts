/**
 * thread-snapshot — base64url codec for ThreadSnapshot in URLs.
 *
 * Keeps the share link short-ish and self-contained, so the OG route
 * can render the exact artifact the reader saw — without a database.
 * "Zero persistence, zero migrations." (Mike §4, §5)
 *
 * The encoded payload is intentionally loose: the decoder is paranoid
 * (see `clampSnapshot`) so bad tokens fall back gracefully.
 */
import { clampSnapshot, type ThreadSnapshot } from './thread-render';

const QUERY_KEY = 't';

/** base64url (URL-safe, no padding). Works in node (≥16) and every browser. */
function toBase64(utf8: string): string {
  // btoa is latin-1 only → route through UTF-8 bytes first.
  return typeof btoa === 'function'
    ? btoa(String.fromCharCode(...new TextEncoder().encode(utf8)))
    : Buffer.from(utf8, 'utf8').toString('base64');
}

function fromBase64(b64: string): string {
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, 'base64').toString('utf8');
}

function b64urlEncode(input: string): string {
  return toBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return fromBase64(padded + pad);
}

export function encodeSnapshotToken(snapshot: ThreadSnapshot): string {
  return b64urlEncode(JSON.stringify(snapshot));
}

export function decodeSnapshotToken(token: string | null | undefined): ThreadSnapshot | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const raw = JSON.parse(b64urlDecode(token));
    return clampSnapshot(raw);
  } catch {
    return null;  // graceful: bad token → caller renders default snapshot
  }
}

/** Build a canonical deep link for a thread keepsake. Relative path only. */
export function buildKeepsakeHref(snapshot: ThreadSnapshot): string {
  return `/article/${encodeURIComponent(snapshot.slug)}?${QUERY_KEY}=${encodeSnapshotToken(snapshot)}`;
}

/** Build the absolute social-unfurl URL (used in og:image meta). */
export function buildUnfurlUrl(origin: string, snapshot: ThreadSnapshot): string {
  const token = encodeSnapshotToken(snapshot);
  return `${origin.replace(/\/$/, '')}/api/og/thread/${encodeURIComponent(snapshot.slug)}?${QUERY_KEY}=${token}`;
}

/** Pull a token off a URLSearchParams-ish record without importing `next/navigation`. */
export function extractToken(params: Record<string, string | string[] | undefined>): string | null {
  const raw = params[QUERY_KEY];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return null;
}

export const SNAPSHOT_QUERY_KEY = QUERY_KEY;
