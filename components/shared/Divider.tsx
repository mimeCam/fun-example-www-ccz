/**
 * Divider — the section-divider kernel · "the hairline is a comma."
 *
 * One stateless kernel · three named placements · no `color`, no `className`,
 * no `style` escape hatch. Six near-duplicates of the same hairline (six
 * files, three alpha specs, three color expressions, four breath rungs)
 * collapse onto one frozen primitive. (Mike napkin #37 §1; Tanya UX #28 §1.)
 *
 *   • `<Divider.Static />`   — inside a card, between sub-blocks. The card's
 *                              entrance owns the breath; the divider is
 *                              ambient geometry.
 *   • `<Divider.Reveal />`   — page entrance / ceremony arrival. Draws from
 *                              the center on `visible: true` via `scale-x-0
 *                              → scale-x-100` over `transition-transform`,
 *                              riding the `fade-neutral` verb. Reduced-motion
 *                              compresses to the 120ms crossfade floor.
 *   • `<Divider.Centered />` — chapter break. `Static` with `mx-auto` and an
 *                              optional italic micro-label below — the only
 *                              variant that earns a label, and only as a
 *                              caption *under* the line (never bisecting it;
 *                              Tanya §5 veto).
 *
 * Frozen contract — what the kernel owns and the call site cannot override:
 *   1. **Color is gold/10.** Always. The divider is site chrome, not warmth;
 *      warmth lives in the surrounding card glow, the archetype name's hue,
 *      and the GoldenThread on the page edge. The historical archetype-tinted
 *      hairline in `MirrorRevealCard.GoldDivider` retires here — the divider
 *      stops poaching Thermal's job (Tanya §3.2 veto). The literal resolves
 *      via `alphaClassOf('gold', 'hairline', 'bg')` so the alpha-call-site
 *      fence stays green and the JIT sees `bg-gold/10` in source.
 *   2. **Width is `max-w-divider` (120px).** Always. The token already
 *      exists in `tailwind.config.ts` (= `var(--sys-maxw-divider)`). No
 *      arbitrary `max-w-[Npx]` overrides; the line is a comma, not a
 *      chapter heading. (Tanya §3.3.)
 *   3. **Endpoints are `rounded-full`.** A 1px line still has endpoints,
 *      and at high pixel density a square endpoint reads as a tick. The
 *      curvature is invisible polish — the kind that, when removed, the
 *      page feels very slightly cheap and nobody can tell you why.
 *      (Tanya §3.5.)
 *   4. **Geometry only.** No box-shadow, no glow, no elevation, no
 *      border. The hairline does not float; it sits in the page like a
 *      comma in a sentence. (Tanya §3.6.)
 *   5. **`role="separator"` + `aria-orientation="horizontal"`** on every
 *      variant. Screen readers announce `separator` once per call, no
 *      chatter; tabbing never lands focus on a divider (it has no
 *      interactive substrate). (Tanya §4.2 / §8 acceptance row 5.)
 *   6. **No `style={}`, no `className` escape hatch.** Spacing is a
 *      typed allowlist (`DividerSpacing`); a fourth use case extends the
 *      kernel, not the caller's class string.
 *
 * Reading-cadence stake (Paul, Tanya §1): the divider is the visible
 * breath between stanzas — the page noticing the reader between sections.
 * The cadence does NOT depend on the animation; under reduced-motion the
 * line snaps and the *spacing* carries the cadence (Tanya §4.2). Every
 * variant honors that floor: spacing is structural, motion is ornament.
 *
 * Adoption fence: `components/shared/__tests__/divider-fence.test.ts`
 * pins five axes (Mike #37 §6, mirror of `dismiss-verb-fence` /
 * `lean-arrow-fence`):
 *   A · No raw `h-px` paired with `max-w-divider` outside this kernel.
 *   B · Kernel reaches `alphaClassOf('gold','hairline',…)` and
 *       `gestureClassesForMotion('fade-neutral', …)`; no raw
 *       `bg-gold/<N>` literal escapes.
 *   C · `<Divider />` is imported by the migrated call sites, no parallel
 *       kernel may emerge.
 *   D · No raw `<hr>` in `app/**` or `components/**` outside the print-
 *       hairline domain (`components/reading/` — `ReadersMark` /
 *       `ArticleProvenance` / the print `<hr>` on `article/[id]/page.tsx`
 *       header). The print kernel is a separate primitive.
 *   E · The verb's seven utterances all spell `divider` (path · symbol ·
 *       fence file · the three named placements · the AGENTS.md row).
 *
 * Pattern of three for fence-helper graduation is now met
 * (`dismiss-verb-fence`, `lean-arrow-fence`, `divider-fence`). Defer the
 * `makeKernelFence()` lift to the fourth verb-primitive — polish, not
 * ambition. (Mike #37 §6 closing note.)
 *
 * TODO(rule-of-three-fence-helper): the three verb-primitive fences now
 * share their five-axis spine (load → walk → assert → format prose). The
 * fourth fence, when it arrives, earns the `makeKernelFence()` extraction.
 * Until then the address book stays honest by repetition.
 *
 * Credits: Krystle Clear (the structural substrate — kernel shape,
 * frozen-variant pattern, fence integration, migration receipts), Mike K.
 * (#37 napkin — kernel + fence shape, name verdict, line-budget,
 * acceptance gate, the "no fourth variant today" rule), Tanya D. (UIX #28
 * — the comma sticky note, the gold/10 single-rung doctrine, the
 * archetype-tint veto, the rounded-full endpoint, the breath table per
 * variant, the label-under-line freeze for `.Centered`, the reduced-motion
 * cadence test), Elon M. (the `Caesura` veto and the `Divider` recovery
 * — the codebase already speaks the word eight places), Paul K. (Reading
 * Cadence as the must-have framing), Sid (this lift — one kernel, six
 * callers, no class hierarchy).
 */

import type { ReactNode } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';
import { gestureClassesForMotion } from '@/lib/design/gestures';

// ─── Frozen geometry handles (JIT-safe literals) ──────────────────────────
//
// One module-scope binding per ledger crossing so the JSX below stays a
// plain class composition and Tailwind's JIT sees every literal in source.
// Pinned by the fence's Axis B — change here, the kernel moves; change at a
// call site, the fence fires. (Same shape as MirrorRevealCard's
// BORDER_HAIRLINE / WHISPER_TEXT handles — Mike napkin #19 §4.2.)

/** Color rung — `bg-gold/10` (`hairline`). Geometry, not surface. */
const HAIRLINE_BG = alphaClassOf('gold', 'hairline', 'bg');

/** Width clamp — 120px via `--sys-maxw-divider`. The line is a comma. */
const HAIRLINE_GEOMETRY = `h-px ${HAIRLINE_BG} max-w-divider rounded-full`;

/** Reveal motion — `fade-neutral` verb, branched on prefers-reduced-motion. */
const FADE_GESTURE = (reduce: boolean): string =>
  gestureClassesForMotion('fade-neutral', reduce);

// ─── Spacing allowlist — typed, JIT-visible literal map ───────────────────
//
// Tanya §3.4: one breath rung per variant, predictable. The allowlist closes
// the door on raw `my-sys-N` overrides at the call site. Every literal lives
// here so the JIT scans them in source — same trap `alphaClassOf` paid for.

/** The four breaths the kernel admits — one per variant + Centered's outlier. */
export type DividerSpacing = 'sys-4' | 'sys-6' | 'sys-7' | 'sys-9';

/** JIT-visible literal lookup for symmetric `my-sys-N` breath. */
const MY_SPACING: Record<DividerSpacing, string> = {
  'sys-4': 'my-sys-4',
  'sys-6': 'my-sys-6',
  'sys-7': 'my-sys-7',
  'sys-9': 'my-sys-9',
};

/** Resolve a spacing token to its `my-sys-N` literal. Pure, ≤ 5 LoC. */
function spacingClass(s: DividerSpacing): string {
  return MY_SPACING[s];
}

// ─── ARIA — the accessible identity every variant carries ─────────────────

const ARIA_PROPS = {
  role: 'separator' as const,
  'aria-orientation': 'horizontal' as const,
};

// ─── Static — inside cards, between sub-blocks ────────────────────────────

/**
 * `Static` props — only the breath token is exposed. Color and width are
 * the kernel's job; the call site picks the rhythm.
 */
export interface DividerStaticProps {
  /** Symmetric vertical breath. Default `sys-4` — inside a card, the card
   *  owns the macro space; the divider whispers (Tanya §3.4). */
  spacing?: DividerSpacing;
}

/** Inside-card hairline — no entrance, no centering, just geometry. */
function DividerStatic({ spacing = 'sys-4' }: DividerStaticProps): JSX.Element {
  return (
    <div
      {...ARIA_PROPS}
      className={`${spacingClass(spacing)} ${HAIRLINE_GEOMETRY}`}
    />
  );
}

// ─── Reveal — page entrance / ceremony arrival ────────────────────────────

/**
 * `Reveal` props — the only variant that animates. Gates behind `visible`
 * and branches on `reduce` so the cadence survives `prefers-reduced-motion`.
 */
export interface DividerRevealProps {
  /** Drives `scale-x-0` (false) → `scale-x-100` (true) on entrance. */
  visible: boolean;
  /** `prefers-reduced-motion`. Compresses the gesture to the 120ms floor. */
  reduce: boolean;
  /** Symmetric vertical breath. Default `sys-7` — between letter sections,
   *  generous breath; the page is paced (Tanya §3.4). */
  spacing?: DividerSpacing;
}

/** The entrance hairline — draws from the center outward as the page lands. */
function DividerReveal({
  visible,
  reduce,
  spacing = 'sys-7',
}: DividerRevealProps): JSX.Element {
  return (
    <div className={`${spacingClass(spacing)} flex justify-center`}>
      <div
        {...ARIA_PROPS}
        className={`${HAIRLINE_GEOMETRY} transition-transform ${FADE_GESTURE(reduce)}
          ${visible ? 'scale-x-100' : 'scale-x-0'}`}
      />
    </div>
  );
}

// ─── Centered — chapter break (Resonances) ────────────────────────────────

/**
 * `Centered` props — the only variant that earns a caption. The label sits
 * *below* the line (Tanya §5 freeze) — never bisecting it; a label-on-line
 * divider reads as a banner, not a comma.
 */
export interface DividerCenteredProps {
  /** Optional italic micro-label below the line. Reads as a caption, not a
   *  heading. Pass plain text or a small inline node (e.g. a date string). */
  label?: ReactNode;
  /** Symmetric vertical breath. Default `sys-9` — chapter breaks need room
   *  to feel like a heading, not a footnote (Tanya §3.4). */
  spacing?: DividerSpacing;
}

/** Chapter-break hairline — centered, with an optional caption underfoot. */
function DividerCentered({
  label,
  spacing = 'sys-9',
}: DividerCenteredProps): JSX.Element {
  return (
    <div className={`${spacingClass(spacing)} text-center`}>
      <div {...ARIA_PROPS} className={`${HAIRLINE_GEOMETRY} mx-auto`} />
      {label !== undefined && label !== null && (
        <p className="text-mist/50 text-sys-micro italic mt-sys-3">{label}</p>
      )}
    </div>
  );
}

// ─── Exported namespace — `.Static` / `.Reveal` / `.Centered` ─────────────

/**
 * The `Divider` namespace exports the three placements as static
 * properties. There is no default export and no bare `<Divider />` — the
 * call site declares its surface explicitly. (Mirror of `DismissButton`'s
 * Inline/Absolute pattern — Mike #90 §"… Decisions" #1.)
 */
export const Divider = {
  Static: DividerStatic,
  Reveal: DividerReveal,
  Centered: DividerCentered,
} as const;

/**
 * Test seam — pure handles + spacing resolver, exposed so adoption tests
 * can pin the geometry/motion ledger crossings without spinning up a
 * renderer for every assertion. Mirrors the `__testing__` idiom on
 * `MirrorRevealCard` (Mike #38 §5).
 */
export const __testing__ = {
  HAIRLINE_BG,
  HAIRLINE_GEOMETRY,
  FADE_GESTURE,
  spacingClass,
  ARIA_PROPS,
} as const;
