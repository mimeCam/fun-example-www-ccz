/**
 * /trust — the quiet room. Tanya #76.
 *
 * A single-screen, reader-invariant page. No thermal warm. No archetype fork.
 * No Golden Thread. The rest of the site breathes warm; this one holds still.
 * Paradox the page resolves: readers who need reassurance distrust
 * reassurance that tries too hard. Therefore the page under-sells itself.
 *
 * Motion contract: arrival only — the site-standard `SuspenseFade` gesture,
 * no new keyframe (Tanya §11). Nothing else moves on this page, ever.
 *
 * Palette contract: `--token-*` thermal tokens are EXPLICITLY FORBIDDEN on
 * foreground-critical surfaces. Body copy, title, hairline rule, and bullet
 * glyphs resolve to static tokens only (`--mist`, `--void-deep`, `--primary`).
 * The `// reader-invariant — /trust page` tags flag each such site for the
 * byte-identity grep (Tanya §5).
 *
 * Layer stack: GoldenThread is NOT mounted on this route — it lives inside
 * `app/article/[id]/page.tsx` and naturally doesn't reach here. ToastHost
 * stays mounted (sitewide, in `ThermalLayout`) but no action on this page
 * fires a toast (Tanya §8).
 *
 * Credits: Tanya D. (UX spec #76 — the entire shape of this page — layout,
 * palette, motion, §10 copy, §15 success test), Paul K. (the "published
 * fence" premise via Tanya #76 §0), Elon M. (the "feel cold, don't talk
 * about cold" discipline — no manifesto, no reader-facing "cold spine"),
 * Mike K. (napkin #62 — `--sys-focus-ink` ships the ring posture this page
 * most visibly benefits from), Krystle C. (the three magic numbers the
 * focus ring on the footer `Trust` link paints with).
 */

import type { Metadata } from 'next';
import { GemHome } from '@/components/navigation/GemHome';
import WhisperFooter from '@/components/shared/WhisperFooter';
import { SuspenseFade } from '@/components/shared/SuspenseFade';
import { CHASSIS_SEAM_TOP_CLASS } from '@/lib/design/spacing';
import {
  TRUST_HEADLINE,
  TRUST_PARAGRAPH,
  TRUST_INVARIANTS,
} from '@/lib/sharing/trust-copy';

export const metadata: Metadata = {
  title: 'On Trust',
  description:
    'Some parts of this site never read you. They look the same for everyone, every time.',
};

export default function TrustPage(): JSX.Element {
  return (
    <main
      id="main-content"
      className="min-h-screen flex flex-col bg-background"
      aria-labelledby="on-trust-title"
    >
      <GemHome />
      <SuspenseFade fallback={null}>
        <TrustColumn />
      </SuspenseFade>
      <WhisperFooter />
    </main>
  );
}

// ─── Sub-components — each ≤ 10 LOC ───────────────────────────────────────

/**
 * The single-column layout. `max-w-3xl` matches the homepage shell verbatim.
 *
 * Chassis-seam call-site (Mike #5 §3a, Tanya UIX #2026-04-28 §3.1): the
 * `${CHASSIS_SEAM_TOP_CLASS}` (rung 9 → `pt-sys-9` → 40px) is the *only*
 * top-edge contributor on this surface. The legacy `py-sys-11 md:py-sys-12`
 * column wrapper and the inner `mt-sys-12` block were both stripped so the
 * H1 cap-height lands on the same pixel row as `/`, `/articles`,
 * `/article/[id]`, `/mirror`, `/resonances`. Bottom is owned by
 * `WhisperFooter` (universal T3 — *"not both" is the rule*, Mike #4 §3).
 *
 * Reader-invariant: `liftVar(9)` resolves to its `0px` SSR fallback because
 * `/trust` lives outside `ThermalProvider`'s carve-out — the seam stays
 * exactly 40px regardless of thermal state on the rest of the site
 * (verified mechanically by `liftVar()`'s fallback in spacing.ts:111).
 */
function TrustColumn(): JSX.Element {
  return (
    <div className={`flex-1 max-w-3xl mx-auto
                    px-sys-4 md:px-sys-6 ${CHASSIS_SEAM_TOP_CLASS}`}>
      <TrustTitle />
      <TrustHairline />
      <TrustParagraph />
      <TrustInvariantList />
    </div>
  );
}

/** `<h1>` — display scale, `--mist` @ α=0.85. No thermal warm. */
function TrustTitle(): JSX.Element {
  // Tanya #76 §5: title locks to --mist at α=0.85 — a non-ledger value,
  // specified deliberately to sit between ALPHA.quiet (0.70) and opacity 1.
  // The four-rung ledger does not have a 0.85 rung, and fabricating one
  // for a single reader-invariant headline would be scope creep. Accepting
  // the exempt mark is the honest path; the reason is grep-visible.
  return (
    <h1
      id="on-trust-title"
      className="font-display text-sys-h1 typo-display
                 text-mist tracking-sys-display"
      // reader-invariant — /trust title locks to static --mist, never --token-*
      // alpha-ledger:exempt — Tanya #76 §5 title α=0.85 (between quiet and 1)
      style={{ opacity: 0.85 }}
    >
      {TRUST_HEADLINE}
    </h1>
  );
}

/** 3ch hairline at dormant-accent α=0.25. Visual receipt of invariance. */
function TrustHairline(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="mt-sys-2 h-px rounded-sys-full"
      // reader-invariant — /trust rule reads --primary (dormant anchor),
      // NOT --token-accent (thermal). 0.25α approximates ALPHA.muted; the
      // hairline is a decorative receipt, not text — WCAG 1.4.11 N/A.
      style={{
        width: '3ch',
        backgroundColor: 'color-mix(in srgb, var(--primary) 25%, transparent)',
      }}
    />
  );
}

/** Three plainspoken sentences. `--mist` @ α=1.0. No warm carve-out. */
function TrustParagraph(): JSX.Element {
  return (
    <p
      className="mt-sys-6 text-sys-body typo-body text-mist"
      // reader-invariant — /trust body copy reads static --mist, never --token-foreground
    >
      {TRUST_PARAGRAPH.map((sentence, i) => (
        <span key={i}>
          {sentence}
          {i < TRUST_PARAGRAPH.length - 1 && ' '}
        </span>
      ))}
    </p>
  );
}

/** Five invariant surfaces. No `<ul>` markers; CSS bullet via ::before. */
function TrustInvariantList(): JSX.Element {
  return (
    <ul className="mt-sys-10 space-y-sys-1 list-none"
        aria-label="Reader-invariant surfaces">
      {TRUST_INVARIANTS.map((label) => (
        <TrustInvariantItem key={label} label={label} />
      ))}
    </ul>
  );
}

/** One row. Bullet glyph is CSS-painted; screen readers read only the label. */
function TrustInvariantItem({ label }: { label: string }): JSX.Element {
  return (
    <li className="py-sys-1 text-sys-body typo-body text-mist flex items-baseline gap-sys-3">
      <span
        aria-hidden="true"
        // reader-invariant — /trust bullet reads static --mist, fixed α=0.45
        style={{ color: 'color-mix(in srgb, var(--mist) 45%, transparent)' }}
      >
        &middot;
      </span>
      <span>{label}</span>
    </li>
  );
}
