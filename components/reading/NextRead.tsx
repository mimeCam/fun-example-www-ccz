/**
 * NextRead — archetype-aware "next read" recommendation, the second beat
 * of the Coda after KeepsakePlate.
 *
 * Whisper, not billboard — gentle suggestion at the article's end. The
 * surface is **always mounted** during the ceremony; visibility is
 * opacity-gated, never structural. Same physics as `AmbientNav.tsx`
 * (lines 80–116, 90–93) — copy the shape, not the code.
 *
 * The four-fix continuity refactor (Mike #67 / Tanya UX #93):
 *
 *   1. Hooks first — `useCeremony()` runs unconditionally on every
 *      render. The `if (!article) return null` paranoia guard lives
 *      below the hook (deleted entirely — `article` is non-nullable in
 *      `NextReadProps`; the call site at `app/article/[id]/page.tsx`
 *      already gates on `recommendation`). Bug A retired.
 *   2. Derived `visible` — `phase === 'gifting' || 'settled'`. No
 *      `useState` mirror. No `useEffect` latch. Less state, no one-frame
 *      delay. Bug B retired.
 *   3. Opacity-gate, not unmount — the wrapper carries
 *      `transition-opacity` × `crossfade-inline` × `opacity-{0,100}`.
 *      `pointer-events-none` + `aria-hidden` keep the hidden lattice
 *      unfocusable. The room never blinks. Bug C/headline retired.
 *   4. Single motion channel — `animate-fade-in` is gone. The opacity
 *      transition IS the arrival; two systems on one wrapper means the
 *      seam is visible. One verb, one register. Bug D retired.
 *
 * Plus Tanya's stagger (UX #93 §4): a `transition-delay` of one `hover`
 * beat (`--sys-time-hover`, 200ms) lets `KeepsakePlate` land first and
 * `NextRead` land one comma later — a single composed coda moment, two
 * sentences spoken in order. The delay is a CSS class on the same
 * opacity transition; no new state, no new effect, no new phase.
 *
 * Per-archetype border + text + glyph live in
 * `lib/design/archetype-accents.ts` — single typed home keyed by
 * `ArchetypeKey`. Mike napkin #96 / Tanya UX #22.
 *
 * Credits: Mike K. (#67 — the four-fix napkin, AmbientNav-precedent
 * shape, no-new-fence rule-of-three deferral), Tanya D. (UX #93 — the
 * felt-sentence audit, the staggered-arrival 200ms `hover` beat, the
 * one-motion-system contract), Krystle C. (#56 — the exact diff and the
 * AmbientNav sibling precedent), Jason F. (#71 — the `crossfade-inline`
 * verb-reuse call), Paul K. (#8 — the polish-triage scope discipline),
 * Elon M. (#70 — Bugs A/B/C first-principles teardown, the doctrine-
 * without-a-test critique), AmbientNav docblock (the canonical write-up
 * — this file is "do what that file does").
 */

'use client';

import { Article } from '@/lib/content/ContentTagger';
import type { ArchetypeKey } from '@/types/content';
import { useCeremony } from './CeremonySequencer';
import { LeanArrow } from '@/components/shared/LeanArrow';
import { TextLink } from '@/components/shared/TextLink';
import { gestureClassesOf } from '@/lib/design/gestures';
import {
  archetypeAccentClass,
  archetypeLabel,
  archetypeAccentGlyph,
  archetypeAccentGlyphClass,
} from '@/lib/design/archetype-accents';
import { wrapClassOf } from '@/lib/design/typography';

/* ─── Wrap policy — `caption` rhythm, `heading` break (Mike #122 §4) ────────
   The Up-Next eyebrow is a caption-rhythm chapter label. Single-word labels
   (today's Up Next) get a silent CSS no-op; if a future copy edit hands
   this site a multi-word label, the wrap saves it from orphaning at 320 px.
   The literal `typo-wrap-heading` lives in `wrapClassOf` only; pinned by
   `caption-heading-wrap-converges.fence.test.ts`. */
const HEADING_WRAP = wrapClassOf('heading');

/* ─── Crossfade verb — same baton AmbientNav rides on its chassis fade ─────
   `crossfade-inline` (120ms, ease-out): "one label replacing another —
   instant enough that I don't see the seam." Module-scope binding so the
   gesture-call-site fence reads the literal at the source level (the
   kernel walker blanks template-literal bodies). One verb, two registers
   on this surface — the wrapper opacity gate AND the per-link transitions
   the children compose downstream. */
const NEXT_READ_GESTURE = gestureClassesOf('crossfade-inline');

/* ─── Visibility class fragments — motion fade endpoints ───────────────────
   Mirrors `AmbientNav.tsx:90,92`. `opacity-100` / `opacity-0` are Motion
   endpoints owned by `lib/utils/animation-phase.ts` under the Alpha Ledger;
   the inline exempt token below licenses this single content surface to
   consume them too — its arrival/departure IS a motion endpoint, the
   continuity-contract sibling of the chrome-rhythm D2 carve-out. The
   `pointer-events-none` half of the hidden state keeps the unfocusable
   wrapper from intercepting clicks during the breathing/warming windows. */
// alpha-ledger:exempt — motion fade endpoint (continuity contract)
const PRESENCE_VISIBLE = 'opacity-100';
// alpha-ledger:exempt — motion fade endpoint (continuity contract)
const PRESENCE_HIDDEN  = 'opacity-0 pointer-events-none';

/* ─── Stagger — one `hover` beat after the Plate (Tanya UX #93 §4) ─────────
   The Plate fades up at gifting+0; this surface waits one `hover` beat
   (`--sys-time-hover`, 200ms — the same number Tanya names in the spec)
   so the eye lands on the Plate first, then drifts down to the next
   door. The delay rides the SAME opacity transition the verb above
   composes — no new state, no new effect, no new phase. The class is a
   literal so Tailwind's JIT can see it; the CSS variable means the
   number stays in `globals.css` (Motion ledger), not in this component. */
const NEXT_READ_DELAY = 'delay-[var(--sys-time-hover)]';

interface NextReadProps {
  article: Article;
  context: string;
  archetype?: ArchetypeKey | null;
}

/**
 * Public surface — always-mounted, opacity-gated, derived `visible`.
 * The hooks fire on every render path; no early `return null` lives
 * above the hook line. Reader-state visibility is paint, not structure.
 */
export function NextRead({ article, context, archetype }: NextReadProps) {
  const { phase } = useCeremony();
  const visible = phase === 'gifting' || phase === 'settled';

  // Tanya UX #22 §5 #5 — fallback is silent: the chip suppresses entirely
  // when no archetype has been resolved yet. The empty-string from
  // `archetypeLabel(undefined|null)` flips this gate to false.
  const label = archetypeLabel(archetype);

  return (
    <div
      data-next-read
      className={wrapperClass(visible)}
      aria-hidden={visible ? undefined : 'true'}
    >
      <UpNextHeader archetype={archetype} label={label} />
      <h3 className="text-sys-xl font-sys-heading text-foreground mb-sys-2 typo-heading">
        {article.title}
      </h3>
      <ContextLine text={context} />
      <NextReadCTA articleId={article.id} />
    </div>
  );
}

/**
 * Wrapper class composer — geometry + the four motion fragments.
 * `transition-opacity` is the property; `crossfade-inline` carries the
 * (duration, ease) pair; the delay is the per-call comma-pause; the
 * presence fragment is the endpoint pair. Pure, ≤ 10 LoC.
 */
function wrapperClass(visible: boolean): string {
  const presence = visible ? PRESENCE_VISIBLE : PRESENCE_HIDDEN;
  return [
    'py-sys-7 transition-opacity',
    NEXT_READ_GESTURE,
    NEXT_READ_DELAY,
    presence,
  ].join(' ');
}

/* ─── Subcomponents ──────────────────────────────────────────────────────── */

interface UpNextHeaderProps {
  archetype?: ArchetypeKey | null;
  label: string;
}

/**
 * "UP NEXT" eyebrow + archetype chip. The chip suppresses entirely when
 * `label` is empty (silent fallback). Tanya UX #22 §3.4: the glyph
 * leadin sits on `aria-hidden` so a screen reader hears the label, not
 * the shape name.
 */
function UpNextHeader({ archetype, label }: UpNextHeaderProps): JSX.Element {
  return (
    <div className="mb-sys-4 flex items-center gap-sys-4">
      <span className={`text-sys-micro tracking-sys-caption uppercase text-mist/50 font-sys-accent ${HEADING_WRAP}`}>
        Up Next
      </span>
      {label && <ArchetypeChip archetype={archetype} label={label} />}
    </div>
  );
}

interface ArchetypeChipProps {
  archetype?: ArchetypeKey | null;
  label: string;
}

/**
 * The archetype chip itself — semiotic discriminator (principle #7) +
 * per-archetype accent border + text-color. The `align-baseline` keeps
 * the rounded `py-sys-1` chip on the same x-height as the
 * `font-sys-accent` "Up Next" kicker (Tanya UX #62 §4.2 / #100 §2.3 —
 * symmetric to the worldview chip's metadata-row landing).
 */
function ArchetypeChip({ archetype, label }: ArchetypeChipProps): JSX.Element {
  return (
    <span
      className={`text-sys-micro tracking-sys-caption font-sys-accent border rounded-sys-full px-sys-3 py-sys-1 align-baseline ${archetypeAccentClass(archetype)}`}
    >
      <span aria-hidden="true" className={archetypeAccentGlyphClass(archetype)}>
        {archetypeAccentGlyph(archetype)}
      </span>
      For the {label}
    </span>
  );
}

/**
 * Context line — the WHY behind the recommendation. Tanya UX #80 +
 * Mike #96 §7 #4: the legacy `/60` alpha snapped to `/50` (the `recede`
 * rung — "frame around the subject"). The line IS the frame around the
 * next-read subject; the rung now matches its UX role.
 */
function ContextLine({ text }: { text: string }): JSX.Element {
  return (
    <p className="text-sys-caption text-mist/50 mb-sys-4 typo-caption">
      {text}
    </p>
  );
}

/**
 * Forward-door CTA — the showcase `passage` moment: hover → feel the
 * destination room's temperature before the click. The `<LeanArrow />`
 * kernel makes this surface join the other forward doors that lean 2px
 * on `:focus-within` (Krystle #61, Tanya §3). Leading space lives
 * INSIDE the kernel's span (Tanya §5.1) — caller drops the trailing space.
 */
function NextReadCTA({ articleId }: { articleId: string }): JSX.Element {
  return (
    <TextLink
      variant="passage"
      href={`/article/${articleId}`}
      className="text-sys-caption font-sys-accent"
    >
      Read this next<LeanArrow />
    </TextLink>
  );
}
