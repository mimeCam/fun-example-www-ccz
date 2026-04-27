/**
 * returner-sentinel — wire-shape tests for `__rt=1`.
 *
 * Three pillars (Mike DoD §6):
 *   1. `markReturner` writes `__rt=1` with the agreed flags (`Path=/`,
 *      `SameSite=Lax`, `Max-Age=7776000`, no `HttpOnly`, `Secure` on https).
 *   2. `clearReturnerSentinel` writes a `Max-Age=0` expiration of the same
 *      cookie (idempotent removal).
 *   3. `hasReturnerCookieHeader` is a *pure* parser — handles `null`,
 *      empty, multi-cookie headers, malformed entries, and is strict on
 *      value (only `'1'` counts; drift folds to `false`).
 *
 * Pure module ⇒ pure tests. We stub `globalThis.document` and
 * `globalThis.location` by hand for the writer tests — same pattern the
 * archetype-store test file uses (no jsdom dependency). The parser tests
 * need no stubs at all.
 */

import {
  RETURNER_COOKIE,
  RETURNER_VALUE,
  RETURNER_TTL_SECONDS,
  hasReturnerCookieHeader,
} from '@/lib/mirror/returner-sentinel';

// ─── Module loader — fresh import per writer test ──────────────────────────

function loadModule() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/mirror/returner-sentinel') as typeof import('@/lib/mirror/returner-sentinel');
}

/** Capture writes to `document.cookie` via a writable accessor. */
function makeDocumentStub() {
  let lastWrite = '';
  const doc = {
    get cookie() { return lastWrite; },
    set cookie(value: string) { lastWrite = value; },
  };
  return { doc, getLastWrite: () => lastWrite };
}

function withDocument(
  fn: (mod: typeof import('@/lib/mirror/returner-sentinel'), getLastWrite: () => string) => void,
  protocol: 'http:' | 'https:' = 'http:',
): void {
  const { doc, getLastWrite } = makeDocumentStub();
  (globalThis as { document?: unknown }).document = doc;
  (globalThis as { location?: unknown }).location = { protocol };
  try { fn(loadModule(), getLastWrite); }
  finally {
    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { location?: unknown }).location;
  }
}

// ─── Wire constants — single source of truth ───────────────────────────────

describe('returner-sentinel — wire constants', () => {
  it('cookie name is "__rt" (the agreed sentinel name)', () => {
    expect(RETURNER_COOKIE).toBe('__rt');
  });

  it('cookie value is "1" (sentinel, not payload)', () => {
    expect(RETURNER_VALUE).toBe('1');
  });

  it('TTL is 90 days in seconds (Elon §risk-2)', () => {
    expect(RETURNER_TTL_SECONDS).toBe(60 * 60 * 24 * 90);
    expect(RETURNER_TTL_SECONDS).toBe(7776000);
  });
});

// ─── markReturner — writer side, SSR-safe ──────────────────────────────────

describe('returner-sentinel — markReturner', () => {
  it('SSR (no document) is a no-op (does not throw)', () => {
    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { location?: unknown }).location;
    const mod = loadModule();
    expect(() => mod.markReturner()).not.toThrow();
  });

  it('writes the sentinel with Path=/, SameSite=Lax, Max-Age=90d', () => {
    withDocument((mod, getLastWrite) => {
      mod.markReturner();
      const written = getLastWrite();
      expect(written).toContain(`${RETURNER_COOKIE}=${RETURNER_VALUE}`);
      expect(written).toContain('Path=/');
      expect(written).toContain('SameSite=Lax');
      expect(written).toContain(`Max-Age=${RETURNER_TTL_SECONDS}`);
    });
  });

  it('omits the Secure flag on http (dev/local)', () => {
    withDocument((mod, getLastWrite) => {
      mod.markReturner();
      expect(getLastWrite()).not.toContain('Secure');
    }, 'http:');
  });

  it('adds the Secure flag on https (production parity with __pt)', () => {
    withDocument((mod, getLastWrite) => {
      mod.markReturner();
      expect(getLastWrite()).toContain('Secure');
    }, 'https:');
  });

  it('does NOT include HttpOnly (matches __pt — bit is reader-visible)', () => {
    withDocument((mod, getLastWrite) => {
      mod.markReturner();
      // case-insensitive check — defensive against future formatter changes
      expect(getLastWrite().toLowerCase()).not.toContain('httponly');
    });
  });
});

// ─── clearReturnerSentinel — expire the sentinel ───────────────────────────

describe('returner-sentinel — clearReturnerSentinel', () => {
  it('SSR (no document) is a no-op', () => {
    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { location?: unknown }).location;
    const mod = loadModule();
    expect(() => mod.clearReturnerSentinel()).not.toThrow();
  });

  it('writes Max-Age=0 to expire the cookie immediately', () => {
    withDocument((mod, getLastWrite) => {
      mod.clearReturnerSentinel();
      const written = getLastWrite();
      expect(written).toContain(`${RETURNER_COOKIE}=${RETURNER_VALUE}`);
      expect(written).toContain('Max-Age=0');
    });
  });
});

// ─── hasReturnerCookieHeader — pure parser ─────────────────────────────────

describe('returner-sentinel — hasReturnerCookieHeader (pure parser)', () => {
  it('returns false for null (no Cookie header)', () => {
    expect(hasReturnerCookieHeader(null)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasReturnerCookieHeader('')).toBe(false);
  });

  it('returns true for the bare sentinel', () => {
    expect(hasReturnerCookieHeader('__rt=1')).toBe(true);
  });

  it('returns true when the sentinel sits inside a multi-cookie header', () => {
    expect(hasReturnerCookieHeader('foo=bar; __rt=1; baz=qux')).toBe(true);
  });

  it('tolerates whitespace around the cookie key', () => {
    expect(hasReturnerCookieHeader('foo=bar;   __rt=1   ; baz=qux')).toBe(true);
  });

  it('returns false when __rt has the wrong value (drift cannot lie)', () => {
    expect(hasReturnerCookieHeader('__rt=0')).toBe(false);
    expect(hasReturnerCookieHeader('__rt=true')).toBe(false);
    expect(hasReturnerCookieHeader('__rt=')).toBe(false);
  });

  it('returns false when __rt is absent (other cookies do not lie)', () => {
    expect(hasReturnerCookieHeader('__pt=deep-diver.0.55; foo=bar')).toBe(false);
  });

  it('skips malformed entries without throwing (no = sign)', () => {
    expect(() => hasReturnerCookieHeader('garbled; __rt=1; alsobad'))
      .not.toThrow();
    expect(hasReturnerCookieHeader('garbled; __rt=1; alsobad')).toBe(true);
  });

  it('does NOT match a different cookie that contains "__rt" as a substring', () => {
    expect(hasReturnerCookieHeader('not__rt=1; __rt_extra=1')).toBe(false);
  });
});
