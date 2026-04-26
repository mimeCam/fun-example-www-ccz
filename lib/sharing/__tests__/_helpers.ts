/**
 * Test helpers — kept tiny on purpose.
 *
 * Underscore-prefixed so jest's `__tests__/**\/*.test.ts` glob skips it; this
 * module exports nothing the runner is meant to execute, only utilities the
 * audit modules import. Each export must stay ≤10 LOC; if a helper grows
 * past that, it earns its own file with its own name.
 *
 * Credits: Mike K. (#70 §C — rule-of-three extraction; the helper shape
 * matches the napkin verbatim), Elon M. (#55 — "tiny helper, not a
 * doctrine" — this file is exactly that and no more).
 */

import { TRUST_INVARIANTS } from '@/lib/sharing/trust-copy';

/**
 * Assert that the audit module honors `TRUST_INVARIANTS[index]` by anchoring
 * to its exact published label. Five reader-invariant promises ship in
 * `trust-copy.ts`; each promise has one audit module; each audit module
 * declares its anchor at the top via this helper. A grep for
 * `assertTrustAnchor(` reveals exactly five sites — one per published index.
 */
export function assertTrustAnchor(index: 0 | 1 | 2 | 3 | 4, label: string): void {
  describe(`TRUST_INVARIANTS[${index}] anchor — this audit honors the published promise`, () => {
    it(`TRUST_INVARIANTS[${index}] is "${label}"`, () => {
      expect(TRUST_INVARIANTS[index]).toBe(label);
    });
  });
}
