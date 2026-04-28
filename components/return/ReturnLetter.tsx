/**
 * ReturnLetter — adaptive homepage greeting for returning readers.
 *
 * Three states:
 *   Stranger  → null (hero unchanged)
 *   Returning (3+ days, has archetype) → full letter card with animation
 *   Known / short absence → compact greeting line
 *
 * Client-only (reads localStorage). SSR-safe via dynamic import.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Letter, LetterContext } from '@/types/book-narration';
import type { ArchetypeKey } from '@/types/content';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useRecognitionPhase } from '@/lib/hooks/useRecognitionPhase';
import { useThermal } from '@/components/thermal/ThermalProvider';
import {
  resolveRecognitionTimeline,
  silentTimeline,
  type RecognitionPhase,
} from '@/lib/return/recognition-timeline';
import { getSeason } from '@/lib/mirror/season-engine';
import { composeLetter } from '@/lib/mirror/letter-engine';
import { generateLetterCard } from '@/lib/mirror/letter-card-generator';
import { Pressable } from '@/components/shared/Pressable';
import { DismissButton } from '@/components/shared/DismissButton';
import { Divider } from '@/components/shared/Divider';
import { ActionPressable } from '@/components/shared/ActionPressable';
import { CopyIcon } from '@/components/shared/Icons';
import { alphaClassOf } from '@/lib/design/alpha';
import { gestureClassesForMotion } from '@/lib/design/gestures';
import { thermalRadiusClassByPosture } from '@/lib/design/radius';
import { copyToClipboard } from '@/lib/sharing/clipboard-utils';
import { useActionPhase } from '@/lib/hooks/useActionPhase';
import { swapWidthClassOf } from '@/lib/design/swap-width';
import { wrapClassOf } from '@/lib/design/typography';

// ─── Alpha-ledger handles (JIT-safe literals via alphaClassOf) ─────────────
//
// One module-scope binding per surface role so the JSX below stays a plain
// className composition and Tailwind's JIT sees every literal in source. The
// pair invariant lives here: `CLOSING_QUIET` is the same rung token as the
// `opacity-quiet` register `RecognitionWhisper` paints in — sibling surfaces
// in the same UX moment, by intent. Pinned in `__tests__/ReturnLetter.alpha`.
//
// Calibration (Tanya UX §3, alpha.ts felt-sentence block):
//   • LABEL_RECEDE     — "the frame around the subject" (the kicker label).
//   • CLOSING_QUIET    — "the closing of a letter" (verbatim).
//   • COMPACT_QUIET    — "content, but not THE content" (hushed greeting).
//   • BORDER_HAIRLINE  — a border IS a line. Shadow owns elevation.
//
// `DIVIDER_HAIRLINE` retired (Sid · Tanya UIX #28 §3.2 / Mike #37 §5):
// the section-divider primitive moved to `<Divider.Reveal />`, the
// kernel paints gold/10 by construction, and the archetype-tinted
// dialect is vetoed at the kernel level. The handle is gone with it.

const LABEL_RECEDE    = alphaClassOf('accent',     'recede',   'text');   // text-accent/50
const CLOSING_QUIET   = alphaClassOf('foreground', 'quiet',    'text');   // text-foreground/70
const COMPACT_QUIET   = alphaClassOf('mist',       'quiet',    'text');   // text-mist/70
const BORDER_HAIRLINE = alphaClassOf('accent',     'hairline', 'border'); // border-accent/10

/* ─── Wrap policy — `caption` rhythm, `heading` break (Mike #122 §4) ────────
   The Because-you-came-back eyebrow rides caption rhythm but heading break
   policy so the felt sentence does not orphan a final word at 320 px.
   Multi-word labels balance; single-word labels get a silent CSS no-op.
   The literal `typo-wrap-heading` lives in `wrapClassOf` only; pinned by
   `caption-heading-wrap-converges.fence.test.ts`. */
const HEADING_WRAP    = wrapClassOf('heading');

/* ─── Wrap policy — `passage` break on the letter body (Tanya UX #85 §3) ───
   The opening + body siblings ride `thermal-typography` (line-height +
   font-weight + text-shadow + paragraph rhythm + print-pin). The carrier
   declares no `text-wrap` policy — at 320 px a final word stranded once
   per dense paragraph. Compose `wrapClassOf('passage')` (wrap-only,
   `text-wrap: pretty`) onto both siblings: keep the breath, lose the
   widow. The literal `typo-wrap-passage` lives in `wrapClassOf` only;
   pinned by `lib/design/__tests__/passage-wrap-converges.fence.test.ts`. */
const PASSAGE_WRAP    = wrapClassOf('passage');

// ─── Timing — owned by the Recognition Timeline (Mike napkin §"Module shape") ─
//
// `RETURN_LETTER_SEED_MS` (50ms) and `RETURN_LETTER_SETTLE_MS` (1200ms)
// retired: the timing for the Return Recognition Moment now lives in
// `lib/return/recognition-timeline.ts` (the typed plan) and
// `lib/hooks/useRecognitionPhase.ts` (the runtime adapter). One ledger
// owns the "when"; this surface owns the "what colour" (Mike napkin
// §"Why this, not the other four sprint candidates" #1).
//
// `COPY_TOAST_MS` retired (Mike napkin #100 §"The change"): the resolved-
// layer dwell now lives inside `useActionPhase` (`ACTION_HOLD_MS`), so the
// hand-rolled setTimeout cascade is gone. `ShareOverlay` graduated next —
// the `mirror-share-confirm` keyframe + the parallel `COPY_TOAST_MS`
// constant are gone too (Mike napkin #100 / this PR). The constant
// disappeared for good; the verb is the only home now.

// ─── Verb-resolved class fragments (Mike napkin #9 §2, Tanya UX §2) ──────
//
// Ledger crossings on this card surface — one paragraph beats three
// scattered annotations (Mike POI-3, Tanya §4.3):
//
//   • Alpha ledger   — rung handles (LABEL_RECEDE, CLOSING_QUIET, …) above.
//   • Motion ledger  — alpha-ledger:exempt — motion fade endpoint;
//                      opacity-0/100 endpoints inside `phaseStyles`.
//   • Gesture ledger — transition timing routes through
//                      `gestureClassesForMotion(verb, reduce)` below.
//                      Verbs: `reveal-keepsake` (card), `fade-neutral`
//                      (divider hairline + Copy & Share label swap).
//
// Both pre-resolve to JIT-visible literal strings via the (perform /
// shorten) table in `lib/design/gestures.ts`. ≤ 10 LoC each.
const REVEAL_GESTURE = (r: boolean): string => gestureClassesForMotion('reveal-keepsake', r);
const FADE_GESTURE   = (r: boolean): string => gestureClassesForMotion('fade-neutral',    r);

// ─── Phase animation ─────────────────────────────────────

type Phase = 'approach' | 'settle' | 'rest';

function phaseStyles(phase: Phase, settled: boolean): string {
  if (phase === 'approach') {
    return 'opacity-0 translate-y-enter-sm'; // alpha-ledger:exempt — motion fade endpoint
  }
  if (phase === 'settle') {
    // Tanya §2.1: bloom halo arrives with the copy — flat warmth, not lift.
    // The border speaks `hairline` (it IS a line); shadow owns elevation.
    // The transition timing now lives on the outer `<div>` via the gesture
    // ledger (`REVEAL_GESTURE(reduce)`); this map stays state-only.
    // alpha-ledger:exempt — motion fade endpoint (opacity-100 = transition target)
    return `opacity-100 translate-y-0 ${BORDER_HAIRLINE} shadow-sys-bloom`;
  }
  // At rest: settled letters keep the bloom (warmth stays); un-settled
  // drop to `sys-rest` (the letter keeps its seat; the warmth leaves).
  // Both states share the `hairline` border rung — the depth signal lives in
  // shadow (`shadow-sys-bloom` vs `shadow-sys-rest`), not in border alpha.
  // alpha-ledger:exempt — motion fade endpoint (opacity-100 = transition target)
  return `opacity-100 translate-y-0 ${BORDER_HAIRLINE} ${settled ? 'shadow-sys-bloom' : 'shadow-sys-rest'}`;
}

/**
 * Reduced-motion landing for the phase machine (Mike POI-1, Tanya §3).
 *
 * A reader who turned motion off would otherwise see the card snap into
 * place visually and then sit in front of a frozen card with no dismiss
 * button, no Copy & Share, no Save as Image for ~1.2 seconds — because
 * the visible gate is `phase === 'rest'`. This pure helper captures the
 * binary decision so the test fence can pin it without spinning up the
 * React effect machinery.
 *
 *   reduce=true  → land at rest+settled in the same render.
 *   reduce=false → null; the Recognition Timeline cascade runs as authored.
 *
 * Now-redundant at runtime — the Recognition Timeline + `useRecognitionPhase`
 * hook short-circuit reduced-motion plans to `'fold'` in one render
 * (`mapLetterPhase('fold') = { phase: 'rest', settled: true }`). The
 * helper survives as a load-bearing TEST SEAM: a structural pin on the
 * "no frozen card" property, decoupled from the runtime carrier so
 * future contributors cannot accidentally regress the contract.
 *
 * Pure, ≤ 10 LoC. Pinned by `__tests__/ReturnLetter.gestures.test.ts`.
 */
function reducedMotionLanding(reduce: boolean): { phase: Phase; settled: boolean } | null {
  return reduce ? { phase: 'rest', settled: true } : null;
}

// ─── Compact greeting (known readers, < 3 days) ──────────

const GREETINGS: Record<ArchetypeKey, string> = {
  'deep-diver': 'Still diving deep? See what\u2019s new beneath the surface.',
  'explorer': 'Still exploring? New trails await.',
  'faithful': 'Back again. The consistent ones find the deepest ideas.',
  'resonator': 'Something resonated before. There\u2019s more to echo.',
  'collector': 'Your library grows. New ideas await.',
};

function CompactGreeting({ archetype }: { archetype: ArchetypeKey }) {
  // Alpha ledger: `quiet` (0.70) — "content, but not THE content."
  // A hushed greeting; the page below is the destination.
  return (
    <p className={`${COMPACT_QUIET} text-sys-md max-w-prose-ch mx-auto mt-sys-2 font-display italic`}>
      {GREETINGS[archetype] ?? GREETINGS['explorer']}
    </p>
  );
}

// ─── Context builder ─────────────────────────────────────

const LABELS: Record<ArchetypeKey, string> = {
  'deep-diver': 'Deep Diver',
  'explorer': 'Explorer',
  'faithful': 'Faithful Reader',
  'resonator': 'Resonator',
  'collector': 'Collector',
};

function readResonanceCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem('resonances');
    return raw ? JSON.parse(raw).length : 0;
  } catch { return 0; }
}

function readRecentTopics(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('reading_memory');
    return raw ? Object.keys(JSON.parse(raw)).slice(0, 5) : [];
  } catch { return []; }
}

function readEvolution(archetype: ArchetypeKey): {
  hasEvolution: boolean;
  trajectory?: 'rising' | 'stable' | 'declining';
  previous?: ArchetypeKey;
} {
  if (typeof window === 'undefined') return { hasEvolution: false };
  try {
    const raw = localStorage.getItem('mirror_snapshots');
    const snaps = raw ? JSON.parse(raw) : [];
    if (snaps.length < 2) return { hasEvolution: false };
    const prev = snaps[0].archetype as ArchetypeKey;
    const hasEvolution = prev !== archetype;
    return {
      hasEvolution,
      previous: prev,
      trajectory: hasEvolution ? 'rising' : 'stable',
    };
  } catch { return { hasEvolution: false }; }
}

function buildContext(rec: ReturnType<typeof useReturnRecognition>): LetterContext | null {
  if (!rec.archetype || rec.daysSinceLastVisit === null) return null;
  const evo = readEvolution(rec.archetype);
  return {
    archetype: rec.archetype,
    archetypeLabel: LABELS[rec.archetype],
    daysSinceLastVisit: rec.daysSinceLastVisit,
    visitCount: rec.visitCount,
    season: getSeason(new Date()),
    resonanceCount: readResonanceCount(),
    recentTopics: readRecentTopics(),
    ...evo,
  };
}

// ─── Letter dismissal ────────────────────────────────────

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ts = localStorage.getItem('letter-dismissed-at');
    if (!ts) return false;
    // Dismiss lasts 7 days — next qualifying return (3+ days) after that shows a fresh letter
    return Date.now() - parseInt(ts, 10) < 7 * 86400000;
  } catch { return false; }
}

function persistDismiss(): void {
  try { localStorage.setItem('letter-dismissed-at', String(Date.now())); } catch { /* noop */ }
}

/**
 * Envelope metadata for the returning-reader letter. SSR-safe: without
 * `window` the origin is omitted and the envelope degrades to a cited
 * blockquote with no back-link. The prose still lands as a blockquote.
 */
function buildLetterEnvelope(): {
  cite?: string; title: string; lang: string;
} {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    ...(origin ? { cite: `${origin}/` } : {}),
    title: 'A letter from the blog',
    lang: 'en',
  };
}

// ─── Letter Card ─────────────────────────────────────────

function LetterCard({
  letter, phase, settled, onDismiss, reduce = false,
}: {
  letter: Letter;
  phase: Phase;
  settled: boolean;
  onDismiss: () => void;
  /** `prefers-reduced-motion` flag, propagated from `useReducedMotion()`. */
  reduce?: boolean;
}) {
  // Copy verb: the third native speaker of the action-receipt fingertip
  // witness (after `QuoteKeepsake` + `ThreadKeepsake`). The hook owns the
  // resolved-layer dwell, the SR peer, the reduced-motion contract and the
  // CheckIcon swap; the component is presentational. (Mike napkin #100 §3,
  // Tanya UX #27 §4.) `Save as Image` stays a plain `<Pressable>` — it's a
  // download (the tab leaves; the browser handles the receipt) and is
  // explicitly out of scope for this PR (Mike POI-6).
  const [copyBusy, setCopyBusy] = useState(false);
  const copySlot = useActionPhase(copyBusy);

  const handleCopy = useCallback(async () => {
    // Build the envelope inside the callback (Mike POI-10): the letter
    // travels with its source on rich-paste targets; plain targets see
    // byte-identical prose. `pulse(false)` keeps the fingertip quiet on
    // failure (the `useActionPhase` fail-quiet covenant).
    const text = [letter.salutation, '', letter.opening, ...letter.body,
      '', letter.closing, '', letter.signOff].join('\n');
    setCopyBusy(true);
    const ok = await copyToClipboard(text, buildLetterEnvelope());
    setCopyBusy(false);
    copySlot.pulse(ok);
  }, [letter, copySlot.pulse]);

  const handleImage = useCallback(() => {
    const url = generateLetterCard(letter);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'return-letter.png';
    a.click();
  }, [letter]);

  const visible = phase === 'rest';

  // Posture-first corner: the helper resolves to the canonical thermal-radius
  // class. The literal lives in `lib/design/radius.ts` only — this surface
  // speaks one posture word (`held`) in one voice (Mike #40 §6.1, Tanya UX
  // #73 §2.1). Off the grandfather list, AND now off the redundant
  // `rounded-sys-medium` companion that used to compose with it (Tanya UIX
  // #30 §4.1 T2 — two radius declarations on one element = one too many,
  // visible at 4× zoom as a faint asymmetric kink on the bottom-right).
  // `thermal-radius` already sets `border-radius: calc(var(--sys-radius-
  // medium) + var(--token-radius-soft))` — it fully owns the corner.
  return (
    <div className={`relative max-w-[32rem] mx-auto my-sys-10 p-sys-8 md:p-sys-9
      max-h-[40vh] overflow-y-auto
      bg-gradient-to-b from-surface to-background
      ${thermalRadiusClassByPosture('held')} border transition-all ${REVEAL_GESTURE(reduce)}
      ${phaseStyles(phase, settled)}`}>
      {/* Dismiss — Universal Exit kernel (Mike #90, Tanya UIX #33): the
          same hand closes every overlay. The historical &times; carve-out
          and its typography-ledger:exempt comment retire with this swap;
          <DismissButton.Absolute /> owns the placement classes
          (top-sys-4 right-sys-4 text-sys-lg leading-none) and the frozen
          aria-label="Close" verb. `size="sm"` survives — density is
          orthogonal to placement (Mike #90 §"… Decisions" #4). */}
      {visible && (
        <DismissButton.Absolute size="sm" onClose={onDismiss} />
      )}
      {/* Label — `recede` (0.50): the frame around the subject. */}
      <p className={`text-sys-micro uppercase tracking-sys-caption ${LABEL_RECEDE} ${HEADING_WRAP} text-center`}>
        Because you came back&hellip;
      </p>
      {/* Salutation */}
      <p className="text-accent text-sys-lg font-display font-sys-heading mt-sys-5 text-center">
        {letter.salutation}
      </p>
      {/* Opening — body of the letter is THE content; meet it head-on (default 1.00). */}
      <p className={`text-foreground text-sys-md thermal-typography ${PASSAGE_WRAP} mt-sys-5 text-center`}>
        {letter.opening}
      </p>
      {/* Body — same register as the opening; the reader's destination. */}
      {letter.body.map((para, i) => (
        <p key={i} className={`text-foreground text-sys-md thermal-typography ${PASSAGE_WRAP} mt-sys-5 text-center`}>
          {para}
        </p>
      ))}
      {/* Divider — `Divider.Reveal` (Sid · Mike #37 / Tanya UIX #28). The
          section-divider primitive owns geometry (gold/10 hairline at 120px
          with rounded endpoints), motion (fade-neutral verb, scale-x reveal
          gated on `visible`), and the reduced-motion floor in one place.
          The `accent`-tinted dialect this site used to speak retired with
          the kernel landing — Tanya §3.2 veto. */}
      <Divider.Reveal visible={visible} reduce={reduce} spacing="sys-7" />
      {/* Closing — `quiet` (0.70): "the closing of a letter."
          Pair invariant: same rung as the whisper-quote register in
          RecognitionWhisper. Pinned in __tests__/ReturnLetter.alpha. */}
      <p className={`${CLOSING_QUIET} text-sys-md italic text-center`}>{letter.closing}</p>
      {/* Sign-off */}
      <p className="text-mist text-sys-caption italic text-center mt-sys-4">{letter.signOff}</p>
      {/* Actions — Copy rides the canonical action-receipt primitive
          (`<ActionPressable>` + `useActionPhase`); the glyph swaps to
          `<CheckIcon>`, the verb to past tense, and the sr-only
          `<PhaseAnnouncement>` peer mounts the witness on settle. The
          long-form name lives in `hint=` (becomes `aria-label` + `title`)
          so the visible label stays inside the primitive's ±1 ch swap
          contract — `Copy` ↔ `Copied`. (Mike napkin #100 §"The change",
          Tanya UX #27 §4.) Save stays a plain `<Pressable>` — the tab
          leaves, the browser owns the receipt (Mike POI-6). */}
      {visible && (
        <div className="mt-sys-7 flex justify-center gap-sys-4">
          <ActionPressable
            variant="ghost"
            size="md"
            onClick={handleCopy}
            phase={copySlot.phase}
            reduced={copySlot.reduced}
            icon={<CopyIcon size={14} />}
            idleLabel="Copy"
            settledLabel="Copied"
            hint="Copy & Share this letter"
            className={swapWidthClassOf(1)}
          />
          <Pressable variant="ghost" size="md" onClick={handleImage}>
            Save as Image
          </Pressable>
        </div>
      )}
    </div>
  );
}

// ─── Letter phase derivation — pure mapping from Recognition Timeline ────
//
// The Return Recognition Moment's TIMING lives in
// `lib/return/recognition-timeline.ts`; this surface only translates the
// timeline's five-phase vocabulary back into the local
// `'approach'|'settle'|'rest'` register the `phaseStyles` map and the
// `__testing__` seam already speak. Pure, ≤ 10 LoC. Mike napkin
// §"Module shape" #2 — surface-side adoption is a phase rename, no
// re-authored cascade.
function mapLetterPhase(p: RecognitionPhase): { phase: Phase; settled: boolean } {
  if (p === 'rest') return { phase: 'approach', settled: false };
  if (p === 'lift') return { phase: 'settle',   settled: false };
  return { phase: 'rest', settled: p !== 'fold' };
}

// ─── Main Component ──────────────────────────────────────

export function ReturnLetter() {
  const rec = useReturnRecognition();
  const reduce = useReducedMotion();
  const { state: thermalState } = useThermal();
  const [dismissed, setDismissed] = useState(false);

  // Build letter context + compose
  const showLetter = rec.isReturning && rec.archetype !== null
    && rec.daysSinceLastVisit !== null && rec.daysSinceLastVisit >= 3
    && !dismissed && !isDismissed();

  const showCompact = rec.isReturning && rec.archetype !== null
    && !showLetter;

  const letterCtx = showLetter ? buildContext(rec) : null;
  const letter = letterCtx ? composeLetter(letterCtx) : null;

  // Animation timeline — owned by the Recognition Timeline ledger.
  // POI-1 (Mike §3.1, Tanya §3): under `prefers-reduced-motion: reduce`
  // the resolver returns the all-floor plan; the hook short-circuits to
  // 'fold' on mount so the dismiss + Copy & Share + Save as Image are
  // immediately interactive — no hand-rolled `setTimeout` cascade in
  // this file. The deps `[showLetter, letter, reduce]` survive on the
  // memo so a future contributor reads the same wiring contract.
  //
  // Recognition Cadence (Mike napkin §"Module shape", Tanya UIX §1.1):
  // pass `thermal` through so warm/luminous returners get a slightly
  // longer approach. Reduced-motion still floors the plan (resolver
  // short-circuits before tempo is consulted). Cold readers get the
  // baseline timing — `recognitionTempo('dormant') === TEMPO_IDENTITY`.
  const timeline = useMemo(
    () => (showLetter && letter)
      ? resolveRecognitionTimeline('letter', { reducedMotion: reduce, thermal: thermalState })
      : silentTimeline(),
    [showLetter, letter, reduce, thermalState],
  );
  const { phase: timelinePhase } = useRecognitionPhase(timeline);
  const { phase, settled } = mapLetterPhase(timelinePhase);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    persistDismiss();
  }, []);

  // Stranger → show nothing
  if (!showLetter && !showCompact) return null;

  // Compact greeting for known readers with short absence
  if (showCompact && rec.archetype) {
    return <CompactGreeting archetype={rec.archetype} />;
  }

  // Full letter card
  if (!letter) return null;
  return (
    <LetterCard
      letter={letter}
      phase={phase}
      settled={settled}
      onDismiss={handleDismiss}
      reduce={reduce}
    />
  );
}

/**
 * Test seam — pure alpha-ledger handles + the inner `LetterCard` /
 * `CompactGreeting` views, exposed so the per-file SSR pin can render the
 * card with a fixed letter object (no hooks, no localStorage, no jsdom).
 * Mirrors the `MirrorRevealCard.__testing__` and `ArticleWhisperPortalInner`
 * idioms (Mike #38 §5; Tanya UX §4).
 *
 * Verb resolvers — `REVEAL_GESTURE(reduce)` and `FADE_GESTURE(reduce)` —
 * plus the `reducedMotionLanding(reduce)` planner are exposed for the
 * gesture-resolution + POI-1 timer-under-reduce pin in
 * `__tests__/ReturnLetter.gestures.test.ts` (Mike napkin #9 §6, Tanya §7).
 */
export const __testing__ = {
  LetterCard,
  CompactGreeting,
  phaseStyles,
  reducedMotionLanding,
  mapLetterPhase,
  REVEAL_GESTURE,
  FADE_GESTURE,
  LABEL_RECEDE,
  CLOSING_QUIET,
  COMPACT_QUIET,
  BORDER_HAIRLINE,
} as const;
