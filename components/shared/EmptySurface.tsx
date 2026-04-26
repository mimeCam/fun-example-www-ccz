/**
 * EmptySurface — the 7th shared primitive. One frame, four rooms.
 *
 * The four quietest rooms (empty-mirror, empty-resonances, 404, error) share
 * one job: *make the silence feel intentional.* Not chirpy. Not apologetic.
 * Curious. Composed. This primitive is the picture-frame that guarantees
 * the four rooms rhyme — same gem, same rhythm, same footer, same type scale.
 * Only the headline, whisper, actions, and a single halo tint change per
 * surface (Tanya §2.5).
 *
 * Composition (top → bottom):
 *   ◇ GemHome (fixed top-left)
 *       ↓
 *   ◆ Halo       — the sole ornament. One GemIcon + one inherited aura.
 *       ↓
 *   Headline     — text-sys-h2, display family (same scale on all four).
 *       ↓
 *   Whisper      — text-sys-body / mist/60, typo-body (two-line target).
 *       ↓
 *   Primary      — <Pressable variant="ghost"> — link OR reset-button.
 *       ↓
 *   Secondary    — <TextLink variant="quiet"> — two lines below.
 *       ↓
 *   WhisperFooter — parity across all four surfaces (Tanya §1 — the two
 *                    surfaces where readers are most lost were the two with
 *                    the fewest exits).
 *
 * Voice contract — the adoption guard:
 *   Consumers pass `headline` / `whisper` as curated strings from
 *   `@/lib/sharing/empty-phrase.ts#emptyPhrase(kind)`. Raw literal props
 *   fail `components/shared/__tests__/empty-adoption.test.ts` unless the
 *   literal is reviewed into `@/lib/sharing/empty-overrides`.
 *
 * Design-token discipline (Tanya §2.2–§2.5):
 *   All spacing via `--sys-space-*`; headline `text-sys-h2`; whisper
 *   `text-sys-body`; content column `max-w-prose-sm`. No ad-hoc literals,
 *   no new ledger entry, no new shadow token, no new animation.
 *
 * Credits: Mike K. (napkin §3 item #3 — 7th shared primitive, pair-rule
 * triggered: adoption test ships in the same PR), Tanya D. (UX §2 — the
 * ThresholdSurface anatomy, per-surface tint table §2.5, single-focal halo
 * §2.4, screenshot test §4), Elon M. (§3.2 — pure CSS variable read for the
 * breath token, no `lib/thermal/` import), Paul K. (§3 — the reset button
 * is the real feature on error; primary is a discriminated union to honor it),
 * Krystle C. (primitive scaffolding pattern & pair-rule discipline).
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { GemHome } from '@/components/navigation/GemHome';
import { GemIcon } from '@/components/shared/GemIcon';
import { Pressable } from '@/components/shared/Pressable';
import { TextLink } from '@/components/shared/TextLink';
import WhisperFooter from '@/components/shared/WhisperFooter';
import type { EmptySurfaceKind } from '@/lib/sharing/reply-lexicon';

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Which halo tint to paint behind the focal gem. Maps to existing design
 * tokens — no new shadow ledger entry (§2.5):
 *   • gold  → dropShadow.sys-whisper (the warmest room — leaning in)
 *   • rose  → boxShadow.rose-glow     (remembered — the intimacy room)
 *   • cyan  → boxShadow.cyan-whisper  (discovery — the redirect room)
 *   • none  → no glow, pure mist       (calm honesty — the error room)
 */
export type EmptySurfaceTint = 'gold' | 'rose' | 'cyan' | 'none';

/** Link target (renders `<Link href=…>`) OR a reset callback (button). */
export type EmptySurfaceAction =
  | { kind: 'link'; href: string; label: string }
  | { kind: 'button'; onClick: () => void; label: string };

export interface EmptySurfaceProps {
  /** Which of the four rooms this frame speaks for. Drives the adoption guard. */
  kind: EmptySurfaceKind;
  /** Curated headline — route through `emptyPhrase(kind)` or review a literal. */
  headline: string;
  /** Curated whisper — route through `emptyPhrase(...)` or review a literal. */
  whisper: string;
  /** Primary action — one slot. A link OR a button (never both). */
  primary: EmptySurfaceAction;
  /** Secondary action — optional TextLink two lines below the primary. */
  secondary?: { href: string; label: string };
  /** Halo tint. Defaults to `gold` — the warmest, room-leaning-in register. */
  tint?: EmptySurfaceTint;
}

// ─── The primitive ─────────────────────────────────────────────────────────

export function EmptySurface(props: EmptySurfaceProps): JSX.Element {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <GemHome />
      <Column>
        <Halo tint={props.tint ?? 'gold'} />
        <Headline>{props.headline}</Headline>
        <Whisper>{props.whisper}</Whisper>
        <Actions primary={props.primary} secondary={props.secondary} />
      </Column>
      <WhisperFooter />
    </main>
  );
}

// ─── Sub-components — each ≤10 LOC (Mike §rules) ───────────────────────────

function Column({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center
                    px-sys-6 py-sys-8 max-w-prose-sm mx-auto text-center">
      {children}
    </div>
  );
}

function Headline({ children }: { children: ReactNode }) {
  return (
    // reader-invariant:forced-colors — `text-foreground` strips; `CanvasText`
    // carries the heading under the OS palette.
    // `empty-stagger-headline` adds animation-delay: var(--sys-time-crossfade)
    // — 120ms, the named "inline dissolve" beat — zeroed under reduced-motion
    // so the halo's gem-appear holds focal authority for the first beat.
    // Tanya UX §6 — the eye reads top-down, gem first then word.
    <h1 className="mt-sys-7 font-display text-sys-h2 font-sys-display
                   tracking-sys-display text-foreground animate-archetype-reveal
                   empty-stagger-headline forced-colors:text-[CanvasText]">
      {children}
    </h1>
  );
}

function Whisper({ children }: { children: ReactNode }) {
  return (
    // reader-invariant:forced-colors — `text-mist/50` collapses to full-presence
    // CanvasText; α-fade is a warm-mode calibration (Tanya UX #53 §3.4).
    <p className="mt-sys-3 text-sys-body typo-body text-mist/50
                  forced-colors:text-[CanvasText]">
      {children}
    </p>
  );
}

function Actions({ primary, secondary }: {
  primary: EmptySurfaceAction; secondary?: { href: string; label: string };
}) {
  return (
    <div className="mt-sys-8 flex flex-col items-center gap-sys-4">
      <PrimaryAction action={primary} />
      {secondary && <SecondaryLink href={secondary.href} label={secondary.label} />}
    </div>
  );
}

function PrimaryAction({ action }: { action: EmptySurfaceAction }) {
  if (action.kind === 'button') return (
    <Pressable variant="ghost" size="md" onClick={action.onClick}>{action.label}</Pressable>
  );
  return (
    <Pressable asChild variant="ghost" size="md">
      <Link href={action.href}>{action.label}</Link>
    </Pressable>
  );
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  return (
    <TextLink variant="quiet" href={href} className="text-sys-caption">
      {label}
    </TextLink>
  );
}

// ─── Halo — the sole ornament ──────────────────────────────────────────────

/**
 * One faceted gem, one inherited aura. The aura is painted via an existing
 * token (no new shadow ledger). The `breath` animation reads
 * `--token-breath-scale` from `:root`; on cold-start that scale is `0` so
 * the halo is literally still (Elon §3.2 — no thermal coupling computed
 * for nothing). As thermal warmth accumulates, the halo inherits a barely
 * perceptible breath (Paul §stakes — loudest where quietest, without cost).
 */
function Halo({ tint }: { tint: EmptySurfaceTint }) {
  // reader-invariant:forced-colors — three tint halos (gold/rose/cyan) all
  // dissolve to none. The gem glyph survives and repaints with CanvasText;
  // the four rooms still rhyme by shape alone (Tanya UX #53 §3.4).
  return (
    <div className={`${haloClass(tint)} rounded-sys-full p-sys-4
                     animate-gem-appear animate-thermal-breath
                     forced-colors:drop-shadow-none forced-colors:shadow-none`}>
      <GemIcon size="lg"
        className={`${gemColorClass(tint)} forced-colors:text-[CanvasText]`} />
    </div>
  );
}

const HALO_CLASSES: Record<EmptySurfaceTint, string> = {
  gold: 'drop-shadow-sys-whisper',
  rose: 'shadow-rose-glow',
  cyan: 'shadow-cyan-whisper',
  none: '',
};

const GEM_COLOR_CLASSES: Record<EmptySurfaceTint, string> = {
  gold: 'text-gold/50',
  rose: 'text-rose/50',
  cyan: 'text-cyan/50',
  none: 'text-mist/30',
};

function haloClass(tint: EmptySurfaceTint): string {
  return HALO_CLASSES[tint];
}

function gemColorClass(tint: EmptySurfaceTint): string {
  return GEM_COLOR_CLASSES[tint];
}
