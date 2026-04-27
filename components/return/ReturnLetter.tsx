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

import { useState, useEffect, useCallback } from 'react';
import type { Letter, LetterContext } from '@/types/book-narration';
import type { ArchetypeKey } from '@/types/content';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { getSeason } from '@/lib/mirror/season-engine';
import { composeLetter } from '@/lib/mirror/letter-engine';
import { generateLetterCard } from '@/lib/mirror/letter-card-generator';
import { Pressable } from '@/components/shared/Pressable';
import { ActionPressable } from '@/components/shared/ActionPressable';
import { CopyIcon } from '@/components/shared/Icons';
import { MOTION, MOTION_REDUCED_MS } from '@/lib/design/motion';
import { alphaClassOf } from '@/lib/design/alpha';
import { gestureClassesForMotion } from '@/lib/design/gestures';
import { thermalRadiusClassByPosture } from '@/lib/design/radius';
import { copyToClipboard } from '@/lib/sharing/clipboard-utils';
import { useActionPhase } from '@/lib/hooks/useActionPhase';

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
//   • DIVIDER_HAIRLINE — "it's geometry; the eye registers it as space."
//   • BORDER_HAIRLINE  — same: a border IS a line. Shadow owns elevation.

const LABEL_RECEDE     = alphaClassOf('accent',     'recede',   'text');   // text-accent/50
const CLOSING_QUIET    = alphaClassOf('foreground', 'quiet',    'text');   // text-foreground/70
const COMPACT_QUIET    = alphaClassOf('mist',       'quiet',    'text');   // text-mist/70
const DIVIDER_HAIRLINE = alphaClassOf('accent',     'hairline', 'bg');     // bg-accent/10
const BORDER_HAIRLINE  = alphaClassOf('accent',     'hairline', 'border'); // border-accent/10

// ─── Timing — sourced from motion tokens ───────────────────

/** Seed delay so approach → settle fires one frame after mount. */
const RETURN_LETTER_SEED_MS = MOTION_REDUCED_MS * 5; // 50ms
/** Settle dwell — `linger` beat plus one `hover` breath. */
const RETURN_LETTER_SETTLE_MS = MOTION.linger + MOTION.hover; // 1200ms
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
 * the timer cascade gates `visible = phase === 'rest'`. This pure helper
 * captures the binary decision so the test fence can pin it without
 * spinning up the React effect machinery.
 *
 *   reduce=true  → land at rest+settled in the same render.
 *   reduce=false → null; the useEffect runs the 50ms / 1200ms cascade.
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
  const dividerScale = phase === 'approach' ? 'scaleX(0)' : 'scaleX(1)';

  // Posture-first corner: the helper resolves to the canonical thermal-radius
  // class. The literal lives in `lib/design/radius.ts` only — this surface
  // speaks one posture word (`held`) in one voice (Mike #40 §6.1, Tanya UX
  // #73 §2.1). Off the grandfather list with this PR.
  return (
    <div className={`relative max-w-[32rem] mx-auto my-sys-10 p-sys-8 md:p-sys-9
      max-h-[40vh] overflow-y-auto
      bg-gradient-to-b from-surface to-background
      rounded-sys-medium ${thermalRadiusClassByPosture('held')} border transition-all ${REVEAL_GESTURE(reduce)}
      ${phaseStyles(phase, settled)}`}>
      {/* Dismiss — typography-ledger:exempt — icon glyph (&times;), no reading
          rhythm; leading-none collapses the line-box around a single char. */}
      {visible && (
        <Pressable
          variant="icon"
          size="sm"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-sys-4 right-sys-4 text-sys-lg leading-none"
        >
          &times;
        </Pressable>
      )}
      {/* Label — `recede` (0.50): the frame around the subject. */}
      <p className={`text-sys-micro uppercase tracking-sys-caption ${LABEL_RECEDE} text-center`}>
        Because you came back&hellip;
      </p>
      {/* Salutation */}
      <p className="text-accent text-sys-lg font-display font-sys-heading mt-sys-5 text-center">
        {letter.salutation}
      </p>
      {/* Opening — body of the letter is THE content; meet it head-on (default 1.00). */}
      <p className="text-foreground text-sys-md thermal-typography mt-sys-5 text-center">
        {letter.opening}
      </p>
      {/* Body — same register as the opening; the reader's destination. */}
      {letter.body.map((para, i) => (
        <p key={i} className="text-foreground text-sys-md thermal-typography mt-sys-5 text-center">
          {para}
        </p>
      ))}
      {/* Divider — `hairline` (0.10): geometry, not surface. The transform
          rides `fade-neutral` (Tanya §2.2: "one thing dissolves while another
          arrives — neither rushing"). The verb resolves to the (fade, sustain)
          row at full motion and to the crossfade floor under reduce — same
          row the Copy/Share label swap rides. */}
      <div className="my-sys-7 flex justify-center">
        <div className={`h-px max-w-divider ${DIVIDER_HAIRLINE} transition-transform ${FADE_GESTURE(reduce)} ${dividerScale}`} />
      </div>
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
          />
          <Pressable variant="ghost" size="md" onClick={handleImage}>
            Save as Image
          </Pressable>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function ReturnLetter() {
  const rec = useReturnRecognition();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('approach');
  const [settled, setSettled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Build letter context + compose
  const showLetter = rec.isReturning && rec.archetype !== null
    && rec.daysSinceLastVisit !== null && rec.daysSinceLastVisit >= 3
    && !dismissed && !isDismissed();

  const showCompact = rec.isReturning && rec.archetype !== null
    && !showLetter;

  const letterCtx = showLetter ? buildContext(rec) : null;
  const letter = letterCtx ? composeLetter(letterCtx) : null;

  // Animation timeline (approach → settle → rest).
  // POI-1 (Mike §3.1, Tanya §3): under `prefers-reduced-motion: reduce`
  // we land at rest+settled in the same render so the dismiss + Copy &
  // Share + Save as Image buttons are immediately interactive — without
  // the branch the reader sits in front of a frozen card for ~1.2s.
  useEffect(() => {
    if (!showLetter || !letter) return;
    const landing = reducedMotionLanding(reduce);
    if (landing !== null) { setPhase(landing.phase); setSettled(landing.settled); return; }
    const t1 = setTimeout(() => setPhase('settle'), RETURN_LETTER_SEED_MS);
    const t2 = setTimeout(() => { setPhase('rest'); setSettled(true); }, RETURN_LETTER_SETTLE_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showLetter, letter, reduce]);

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
  REVEAL_GESTURE,
  FADE_GESTURE,
  LABEL_RECEDE,
  CLOSING_QUIET,
  COMPACT_QUIET,
  DIVIDER_HAIRLINE,
  BORDER_HAIRLINE,
} as const;
