/**
 * gestures-call-site-rhythm — pinning fence for the `whisper-linger`
 * migration receipt (verb #13). Reads the raw source of the three call
 * sites that share the (beat=`linger`, ease=`out`) breath and asserts they
 * all spell the migrated factory call IDENTICALLY.
 *
 * Why a separate fence (Mike napkin #91 §4.3, Paul risk #2 mitigation):
 *
 *   • The verb is born of three call sites that already shared the rhythm
 *     by accident of three independently-typed class strings. The verb
 *     names that breath. If a future PR rewrites *one* site to drift
 *     against the other two, the migration receipt is forfeit — the
 *     felt sentence ("the room is exhaling a thought it doesn't quite
 *     say") fragments by 1px of timing.
 *
 *   • The Atlas's `gestures-call-site-fence.test.ts` (Axis C, the bare-
 *     class lint) catches *new* `duration-linger ease-X` drift in scope.
 *     This fence is the dual: it pins the *positive* shape — every
 *     migrated site reads the SAME `gestureClassesOf('whisper-linger')`
 *     literal — so the rhythm cannot drift back even if the class lint
 *     is fooled (e.g. a future verb renaming).
 *
 *   • The grandfather list ONLY shrinks. This fence is what makes that
 *     promise structural for `whisper-linger`'s three sites: removing
 *     them from the list is paired with pinning their migrated text.
 *     Same shape AGENTS.md describes for verb-by-verb redemption.
 *
 * Pure source-string lint. No DOM, no React render, no Jest jsdom
 * warmup. Each assertion ≤ 10 LoC; the whole fence ≤ 30 LoC of test body.
 *
 * Credits: Mike K. (architect napkin #91 — the pre-PR rhythm-audit shape,
 * the per-site `fs.readFileSync` + grep-for-the-literal pattern lifted
 * from `gesture-call-site-fence` Axis C, the migration-receipt-as-fence
 * discipline), Tanya D. (UIX §1 — the felt sentence "the room is
 * exhaling a thought it doesn't quite say" the three sites must keep in
 * unison; the surface-domain block placement that gives them a single
 * home), Krystle C. (verb #13 — the proposal this fence ratifies),
 * Paul K. (risk #2 — the byte-identical concern this test resolves).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gestureClassesOf } from '@/lib/design/gestures';

const ROOT = join(__dirname, '..', '..', '..');

/** The verb whose rhythm this fence pins. One word; one breath. */
const VERB = 'whisper-linger' as const;

/**
 * The four sites that share the (linger, out) breath. The first three shared
 * the rhythm longhand pre-Atlas; verb #13 named the breath and the rhythm
 * fence pinned it. `EvolutionThread` (Mike napkin #N, Tanya UX §3.2) joins
 * the chord as the fourth — the resonance page's between-card whisper now
 * exhales on the same beat as the room's other whispers.
 *
 * Order matches the felt journey: arrival → return → waypoint → history.
 * (Tanya UX §1, Mike POI-5.)
 */
const SITES: readonly string[] = [
  'components/home/ViaWhisper.tsx',
  'components/return/RecognitionWhisper.tsx',
  'components/navigation/GemHome.tsx',
  'app/resonances/EvolutionThread.tsx',
] as const;

/** The exact call expression every migrated site must contain. */
const FACTORY_CALL = `gestureClassesOf('${VERB}')`;

/** Read raw file source from project root — pure, ≤ 10 LoC. */
function readSite(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

// ─── Tests — every site spells the migrated literal ───────────────────────

describe('gestures-call-site-rhythm — three sites, one breath', () => {
  SITES.forEach((rel) => {
    it(`${rel} reads gestureClassesOf('${VERB}') in source`, () => {
      expect(readSite(rel)).toContain(FACTORY_CALL);
    });
  });

  it('every site imports gestureClassesOf from the canonical seam', () => {
    SITES.forEach((rel) => {
      expect(readSite(rel)).toMatch(
        /import\s*\{[^}]*\bgestureClassesOf\b[^}]*\}\s*from\s*['"]@\/lib\/design\/gestures['"]/,
      );
    });
  });
});

// ─── Tests — the rhythm itself, pinned through the table ──────────────────

describe('gestures-call-site-rhythm — the row binds (beat=linger, ease=out)', () => {
  it("gestureClassesOf('whisper-linger') is the literal 'duration-linger ease-out'", () => {
    expect(gestureClassesOf(VERB)).toBe('duration-linger ease-out');
  });

  it('no migrated site composes a bare `duration-linger` pair anymore', () => {
    SITES.forEach((rel) => {
      expect(readSite(rel)).not.toMatch(/duration-linger\s+ease-\w+/);
    });
  });
});
