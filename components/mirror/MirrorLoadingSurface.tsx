/**
 * MirrorLoadingSurface — the two heartbeats before /mirror resolves.
 *
 * Routes through the shared `<Skeleton variant="card">` primitive so the
 * breath cadence (`MOTION.linger`, 1000ms) and reduced-motion floor
 * (`ALPHA.muted`) match every other loading surface on the site. No
 * bespoke keyframe; no archetype-color pre-promise; no border/shadow
 * before the reveal earns them.
 *
 * Geometry mirrors `MirrorRevealCard` exactly (Tanya UX #47 §3.1):
 *   - same width  (`max-w-md`)
 *   - same radius (`ceremony` posture, resolved through `thermalRadiusClassByPosture`)
 *   - same padding (`p-sys-8`)
 *   - same vertical center (parent's `min-h-[85vh]` flex column)
 *
 * Inner composition silhouettes the reveal's type rhythm — RevealLabel,
 * ArchetypeName, WhisperQuote (×2 lines for the typical centered rag),
 * GoldDivider — so the eye is already parked at the right vertical
 * positions when the words arrive. Anchor principle: the swap reads as
 * a fade-up of the same surface, not a substitution of two surfaces.
 *
 * Credits: Tanya D. (UX spec #47 §3.1–§4.3 — geometry-parity discipline,
 * type-rhythm silhouette, no archetype pre-promise, single radius for
 * both phases), Mike K. (napkin #19 §0 — "skeleton lives inside the card,
 * not as a sibling component"; this file is the call-site composition,
 * not a 9th primitive), Paul K. (first-30-seconds bar — the reveal feels
 * inevitable when the silhouette is already there).
 */

import { Skeleton } from '@/components/shared/Skeleton';
import { thermalRadiusClassByPosture } from '@/lib/design/radius';

/* Radius-ledger handle — typed posture, JIT-safe. The class literal
   lives once in `lib/design/radius.ts`; this file speaks the posture
   word that resolves to it. Output bytes: identical to the prior
   `thermal-radius-wide` string. Sibling-handle parity with
   `MirrorRevealCard.tsx:36` — both /mirror surfaces answer the same
   posture word for the same reason they share `max-w-md`. The corner
   is the same corner before and after the swap.
   (Mike napkin #63 §5.1 / Tanya UX #52 §2.1, §5) */
const THERM_CEREMONY = thermalRadiusClassByPosture('ceremony');

/** The skeleton's outer geometry — pinned to MirrorRevealCard's outer card. */
const CARD_GEOMETRY =
  `max-w-md w-full ${THERM_CEREMONY} p-sys-8 min-h-[18rem]`;

/**
 * Vertical rhythm: four child placeholders matching the reveal's voice
 * order. Width fractions roughly match the centered-text rag of the real
 * content (50–90% of inner width) so the reveal lands into "its own slot."
 */
const LINE_RHYTHM = [
  'h-3 w-1/3 mb-sys-4 mx-auto',  // RevealLabel placeholder ("Because you stayed…")
  'h-6 w-2/3 mb-sys-5 mx-auto',  // ArchetypeName placeholder
  'h-3 w-5/6 mb-sys-2 mx-auto',  // WhisperQuote — line 1
  'h-3 w-3/5 mx-auto',           // WhisperQuote — line 2 (centered rag)
] as const;

/**
 * Loading surface for `/mirror`. Renders one card-shaped skeleton with
 * four child line skeletons. The shared primitive owns the breath;
 * children inherit it via `.sys-skeleton .sys-skeleton` opacity rule.
 */
export default function MirrorLoadingSurface(): JSX.Element {
  return (
    <Skeleton variant="card" className={CARD_GEOMETRY}>
      {LINE_RHYTHM.map((sizing, i) => (
        <Skeleton key={i} variant="line" className={sizing} />
      ))}
    </Skeleton>
  );
}
