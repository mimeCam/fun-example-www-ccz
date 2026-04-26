/**
 * ToastHost.quiet — host-level gate during the gifting phase.
 *
 * This test pins the §1 cut of Mike's napkin: the suppression lives in the
 * host, not at every `toastShow(...)` call site. The test environment is
 * `node` (no jsdom), so we don't try to render the portal — we lock down
 * the source-file invariants that prove the gate is wired:
 *
 *   1. `<ToastHost>` imports `useCeremonyQuiet` from the canonical hook.
 *   2. The host calls `useCeremonyQuiet()` exactly once.
 *   3. The host hands its child tree a `null` slot when quiet (preserving
 *      the live region — ARIA `role="status"` wrapper still mounts).
 *   4. The redundant per-call-site gates removed by this sprint actually
 *      ARE removed — `StateCrossingFlash.tsx` no longer reads `useCeremony`,
 *      and `SelectionPopover.tsx` reads `useCeremonyQuiet` (not raw phase).
 *
 * The render-shape test (toast-during-quiet emits empty live region) is
 * deferred to a follow-up sprint with jsdom — same idiom as `Toast.test`,
 * which the project doesn't yet ship. The structural fences here are
 * sufficient to catch the regressions that Tanya §10 cared about.
 *
 * Credits: Mike K. (napkin §1 + §6.1 — host-level gate is the lever),
 * Tanya D. (UX §5 — output vs input distinction enforced by file location),
 * existing `useScrollRise.test.ts` (source-file analysis pattern).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Erase comment bodies so prose mentions don't false-positive structural regexes. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}

const ROOT = join(__dirname, '..', '..', '..');
const HOST_SRC    = stripComments(readFileSync(join(ROOT, 'components/shared/ToastHost.tsx'), 'utf8'));
const FLASH_SRC   = stripComments(readFileSync(join(ROOT, 'components/reading/StateCrossingFlash.tsx'), 'utf8'));
const POPOVER_SRC = stripComments(readFileSync(join(ROOT, 'components/resonances/SelectionPopover.tsx'), 'utf8'));

// ─── Host-level gate (Mike §1 + §6.1) ──────────────────────────────────────

describe('ToastHost — quiet-zone gate is wired at the host', () => {
  it('imports useCeremonyQuiet from the canonical hook path', () => {
    expect(HOST_SRC).toMatch(/from\s+['"]@\/lib\/hooks\/useCeremonyQuiet['"]/);
    expect(HOST_SRC).toMatch(/\buseCeremonyQuiet\b/);
  });

  it('calls useCeremonyQuiet() exactly once (single source of truth)', () => {
    const calls = HOST_SRC.match(/useCeremonyQuiet\s*\(\s*\)/g) ?? [];
    expect(calls).toHaveLength(1);
  });

  it('hands a null slot to the child tree when quiet (drops, no defer)', () => {
    // The host must compose `quiet ? null : current` (or equivalent) so the
    // live region stays mounted but the toast child does not render.
    expect(HOST_SRC).toMatch(/quiet\s*\?\s*null\s*:\s*current/);
  });

  it('still renders the role="status" live-region wrapper (ARIA preserved)', () => {
    expect(HOST_SRC).toMatch(/role=["']status["']/);
    expect(HOST_SRC).toMatch(/aria-live=["']polite["']/);
  });
});

// ─── Subscription-side cut frees StateCrossingFlash (Mike §6.3) ────────────

describe('StateCrossingFlash — render-time `gifting` gate has been removed', () => {
  it('no longer imports useCeremony (subscription drops upstream)', () => {
    expect(FLASH_SRC).not.toMatch(/from\s+['"]@\/components\/reading\/CeremonySequencer['"]/);
    expect(FLASH_SRC).not.toMatch(/\buseCeremony\b\s*\(/);
  });

  it('no longer contains a render-time `phase === \'gifting\'` check', () => {
    expect(FLASH_SRC).not.toMatch(/phase\s*===\s*['"]gifting['"]/);
  });
});

// ─── SelectionPopover keeps its input-side gate (Tanya §5) ─────────────────

describe('SelectionPopover — input-side gate uses useCeremonyQuiet', () => {
  it('imports useCeremonyQuiet (not the raw context predicate)', () => {
    expect(POPOVER_SRC).toMatch(/from\s+['"]@\/lib\/hooks\/useCeremonyQuiet['"]/);
    expect(POPOVER_SRC).toMatch(/\buseCeremonyQuiet\s*\(/);
  });

  it('does NOT read `useCeremony().phase` directly anymore', () => {
    expect(POPOVER_SRC).not.toMatch(/useCeremony\s*\(/);
    expect(POPOVER_SRC).not.toMatch(/phase\s*===\s*['"]gifting['"]/);
  });
});
