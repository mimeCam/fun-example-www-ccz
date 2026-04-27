/**
 * returner-sentinel — the `__rt=1` cookie. A flag, not a payload.
 *
 * The killer feature ("the blog that reads you back") only fires for readers
 * the server can recognize *before paint*. The Mirror snapshot lives in
 * `localStorage` (durable, reader-confirmed) — invisible to the middleware.
 * This module emits a server-visible echo of the *fact* of having a Mirror
 * answer: a single bit (`__rt=1`) that says "this reader has answered the
 * Mirror once." Nothing more.
 *
 * Wire-shape contract (Mike `§3` napkin diagram):
 *   Name          `__rt`
 *   Value         `'1'` (sentinel, not payload — never an archetype key)
 *   TTL           90 days  (long enough for "same reader, weeks later")
 *   Path          `/`
 *   SameSite      `Lax`
 *   HttpOnly      `false`  (parity with `__pt`; the bit is "I've been here",
 *                           no PII, no privilege)
 *   Secure        on https only (parity with `__pt`)
 *
 * Discipline (Sid's lab — every function ≤ 10 LOC, pure where possible):
 *   • `markReturner` / `clearReturnerSentinel` touch `document` (unavoidable
 *     wire side-effect), but the parser `hasReturnerCookieHeader` is pure for
 *     tests and middleware-side use.
 *   • SSR-safe — every writer guards on `typeof document === 'undefined'`.
 *   • No archetype payload — this module never imports `ArchetypeKey`. The
 *     cookie is flag-only by construction, so no future contributor can
 *     accidentally widen its meaning.
 *
 * Cleared-storage drift (Tanya UX §5, Elon risk #1): if the reader clears
 * `localStorage` while keeping cookies, `__rt=1` lies. The agreed-upon
 * mitigation is **neutral fallback**: middleware skips `__pt`, the Mirror
 * read returns `null`, the page paints in neutral. Neutral > wrong-tone.
 * The Mirror layer re-derives on the next dwell-gated reveal, which re-writes
 * `__rt`. Documented here so the rule stays load-bearing on this seam.
 *
 * Credits: Mike K. (`from-michael-koch-project-architect-9.md` §1-§7 — the
 * sentinel-not-payload invariant, the cookie-shape table, the "every Mirror
 * write also marks returner" fence, the no-new-deps rule, the parser-
 * symmetry note pointing at `archetype-store.ts:readCookie()`), Tanya D.
 * (UX §5 — the cleared-storage neutral-fallback call documented here),
 * Elon M. (the four risk flags — TTL, drift, telemetry-deferred, HttpOnly —
 * named in the cookie-shape contract above so they cannot be quietly lost).
 */

// ─── Wire constants — single source of truth ───────────────────────────────

/** Cookie name. The middleware reads this; client writers write this. */
export const RETURNER_COOKIE = '__rt';

/** Cookie value. Always `'1'` — domain is `{absent, '1'}`, never wider. */
export const RETURNER_VALUE = '1';

/** TTL — 90 days. Long enough for "same reader, weeks later" (Elon §risk-2). */
export const RETURNER_TTL_SECONDS = 60 * 60 * 24 * 90;

// ─── Client writers — touch `document.cookie` (SSR-safe) ───────────────────

/** True when running on https — gates the `Secure` cookie attribute. */
function isSecureContext(): boolean {
  if (typeof location === 'undefined') return false;
  return location.protocol === 'https:';
}

/** Build the cookie string. Pure, ≤ 10 LOC. Tested via `markReturner` writes. */
function buildCookieString(maxAge: number): string {
  const base = `${RETURNER_COOKIE}=${RETURNER_VALUE}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  return isSecureContext() ? `${base}; Secure` : base;
}

/**
 * Mark the current reader as a returner — write `__rt=1` to `document.cookie`.
 * SSR-safe: no-op when `document` is undefined. Idempotent — overwriting an
 * existing `__rt=1` with the same payload is a no-op for the wire.
 */
export function markReturner(): void {
  if (typeof document === 'undefined') return;
  document.cookie = buildCookieString(RETURNER_TTL_SECONDS);
}

/**
 * Clear the returner sentinel — set Max-Age=0 to expire it immediately.
 * Reserved for the (currently theoretical) "clear my Mirror" admin/debug
 * path; if such a path is ever wired up, it MUST call this alongside
 * `localStorage.removeItem(MIRROR_STORAGE_KEY)`. SSR-safe.
 */
export function clearReturnerSentinel(): void {
  if (typeof document === 'undefined') return;
  document.cookie = buildCookieString(0);
}

// ─── Pure parser — server-side and unit-test surface ───────────────────────

/**
 * Find a single cookie value by name in a raw `Cookie:` header. Pure helper
 * mirroring the precedent in `archetype-store.ts:readCookie()`. Returns
 * `null` when the header is empty or the cookie is absent.
 */
function readCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/**
 * True when the raw `Cookie:` header carries a `__rt=1` sentinel. Pure;
 * accepts `null`/`undefined` for the SSR/no-cookie case and folds them to
 * `false`. Strict on value — only the sentinel `'1'` counts; anything else
 * (`'0'`, empty, drift) reads as absent so a malformed payload can't lie.
 */
export function hasReturnerCookieHeader(cookieHeader: string | null): boolean {
  return readCookieValue(cookieHeader, RETURNER_COOKIE) === RETURNER_VALUE;
}
