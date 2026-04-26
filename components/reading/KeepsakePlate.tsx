/**
 * KeepsakePlate — the inline live preview of the reader's own thread
 * keepsake, embedded in the article Coda as the visible result of the
 * completion ceremony's `gifting` phase.
 *
 * Replaces the discoverable-button `KeepsakeLauncher`. Where the launcher
 * asked, the Plate offers — the reader's first instinct should be to look
 * closer, not to dismiss a call to action. (Mike #41 §10, Tanya UX #74 §2.)
 *
 * Posture mapping (reviewer-literacy, NOT typed coupling — see
 * `AGENTS.md` lines 24-26):
 *   • Outer corner   → `posture: 'ceremony'` rung (rounded-sys-wide).
 *   • Inner thumb    → `posture: 'held'` rung (rounded-sys-medium).
 *   • Entrance beat  → `MOTION.reveal` family, fired on `phase === 'gifting'`.
 *   • Click → modal  → crossfade family — owned by `<Threshold>`, not us.
 * Do NOT codify this mapping in a helper. Posture suggests; the surface
 * picks. (Mike #40 §6.3, Tanya UX #73 §2.2.)
 *
 * Determinism: the SVG painted here is byte-identical to the one rendered
 * at full size in the modal AND served by `/api/og/thread`, because all
 * three consume the SAME `useThreadSnapshot()` frozen object via
 * `buildThreadSVG()`. Preview === unfurl. Mike §6.2.
 *
 * Failure modes (silent — never visible):
 *   • Snapshot null (ceremony hasn't fired) → renders nothing.
 *   • Archetype unknown → posture-only ("A Reader") via thread-render.
 *   • Reduced motion    → at-rest opacity, no fade beat.
 *
 * Credits: Mike K. (#41 — napkin, posture mapping, determinism contract,
 * failure-mode discipline), Tanya D. (UX #74 — Coda layout, three-act
 * order, single-primary rule, gold-glow shadow family), Paul K.
 * (experiences #3+#4 — completion as ceremony, the mint).
 */
'use client';

import { ThreadKeepsake } from '@/components/reading/ThreadKeepsake';
import { Pressable } from '@/components/shared/Pressable';
import {
  buildThreadSVG, KEEPSAKE_DIMENSIONS, type ThreadSnapshot,
} from '@/lib/sharing/thread-render';
import { CHECKPOINTS, emitCheckpoint } from '@/lib/hooks/useLoopFunnel';
import {
  useKeepsakePreview, type PlateRevealState,
} from '@/lib/hooks/useKeepsakePreview';
import { MOTION } from '@/lib/design/motion';
import { thermalRadiusClassByPosture } from '@/lib/design/radius';

interface KeepsakePlateProps {
  articleId: string;
  title: string;
}

/** Reveal-state → entrance class. Static map so the JIT sees the literals. */
const REVEAL_CLASS: Record<PlateRevealState, string> = {
  hidden:  '',
  reveal:  'entrance-fade-up',
  settled: '',
};

/** Inline style — the entrance beat's duration (one named token). Pure. */
function revealStyle(reduced: boolean): React.CSSProperties | undefined {
  if (reduced) return undefined;
  return { ['--entrance-duration' as string]: `${MOTION.reveal}ms` };
}

/**
 * Public surface. Mounts only when the ceremony has reached `gifting`
 * AND a frozen snapshot is available — otherwise renders nothing so
 * the Coda height does not jump.
 */
export function KeepsakePlate({ articleId, title }: KeepsakePlateProps) {
  const view = useKeepsakePreview({ articleId, title });
  if (view.revealState === 'hidden' || !view.snapshot) return null;
  return (
    <>
      <PlateSurface
        snapshot={view.snapshot}
        revealState={view.revealState}
        reduced={view.reduced}
        onClick={() => { view.open(); emitCheckpoint(CHECKPOINTS.KEEPSAKED); }}
      />
      <ThreadKeepsake
        isOpen={view.isOpen}
        onClose={view.close}
        snapshot={view.snapshot}
      />
    </>
  );
}

/* ─── Subcomponents ─────────────────────────────────────────────────────── */

interface PlateSurfaceProps {
  snapshot: ThreadSnapshot;
  revealState: PlateRevealState;
  reduced: boolean;
  onClick: () => void;
}

/**
 * The visible tile — wraps the press-phase consent primitive. The
 * Plate IS a `<Pressable>`: the entire surface is one consent verb
 * ("open my keepsake"), the page's only solid invitation at completion.
 * Tanya UX §2.4 — single primary on the Coda; NextRead drops to a
 * passage TextLink so two CTAs do not fight for the eye.
 *
 * Posture override: the press primitive defaults to `posture: 'held'`
 * (rounded-sys-medium via `.thermal-radius`); the Plate upgrades to
 * `posture: 'ceremony'` via `thermalRadiusClassByPosture('ceremony')` —
 * one helper call, no string literal, ledger stays the source of truth.
 */
function PlateSurface(p: PlateSurfaceProps) {
  const animClass = p.reduced ? '' : REVEAL_CLASS[p.revealState];
  return (
    <div
      className={`mt-sys-7 mb-sys-6 flex justify-center ${animClass}`.trim()}
      style={revealStyle(p.reduced)}
      data-keepsake-plate
    >
      <Pressable
        variant="solid"
        size="md"
        onClick={p.onClick}
        aria-label="Open your thread keepsake"
        className={plateClass()}
      >
        <PlateThumbnail snapshot={p.snapshot} />
        <PlateCaption />
      </Pressable>
    </div>
  );
}

/**
 * Class fragment composed once. Block layout overrides the press
 * primitive's `inline-flex justify-center` so children stack vertically;
 * `text-left` overrides centered text inside the Pressable. The corner
 * resolves to `thermal-radius-wide` via the helper — posture: ceremony.
 */
function plateClass(): string {
  return [
    'block w-full max-w-md text-left',
    thermalRadiusClassByPosture('ceremony'),
  ].join(' ');
}

/**
 * The inline SVG — same builder, same bytes as the modal and unfurl.
 * Renders the full 1200×630 viewBox into a small box; SVG scales perfectly
 * (no raster preview, no hi-DPI artifacts).
 */
function PlateThumbnail({ snapshot }: { snapshot: ThreadSnapshot }) {
  const svg = buildThreadSVG(snapshot);
  return (
    <div
      role="img"
      aria-label={`Your thread keepsake for ${snapshot.title || 'this read'}`}
      className="rounded-sys-medium overflow-hidden border border-fog/30 bg-void w-full"
      style={{ aspectRatio: `${KEEPSAKE_DIMENSIONS.width} / ${KEEPSAKE_DIMENSIONS.height}` }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** The "Keep this thread →" eyebrow caption. One verb, one direction. */
function PlateCaption() {
  return (
    <p className="mt-sys-3 mb-sys-1 text-center text-gold text-sys-caption font-sys-accent">
      Keep this thread →
    </p>
  );
}
