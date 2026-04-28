/**
 * StratifiedRenderer — renders article content in visible layers.
 *
 * Core is always shown. Marginalia appears for returning readers.
 * Archetype extensions fade in with a gold shimmer on first discovery.
 * NewContentBadge marks first-time reveals with a ✦ icon.
 *
 * Thermal-aware: uses CSS custom properties (--token-*) for all colors.
 * No hard-coded hex values in components — all resolve to design tokens.
 *
 * Core paragraphs carry data-paragraph-id for the engagement tracking pipeline.
 */

'use client';

import { Fragment } from 'react';
import type { ArchetypeKey, ResolvedParagraph } from '@/types/content';
import type { ContentBlock } from '@/lib/content/content-layers';
import {
  getExtensionLabel,
  getExtensionBorderColor,
} from '@/lib/content/content-layers';
import { passageThermalClass, wrapClassOf } from '@/lib/design/typography';
import { Divider } from '@/components/shared/Divider';
import { alphaClassOf } from '@/lib/design/alpha';
import { NewContentBadge } from './NewContentBadge';

/* ─── Alpha-ledger handles (JIT-safe literals via alphaClassOf) ─────────────
   Sister to `Divider.HAIRLINE_BG`, `MirrorRevealCard.BORDER_HAIRLINE`,
   `EvolutionThread.HAIRLINE_BORDER`, and `ResonanceEntry`'s ledger family.

   This file is the LAST file to graduate off
   `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS` (Mike napkin #117 / Tanya UIX
   "Stratified Room"). Every translucent surface this renderer paints now
   resolves through `alphaClassOf()` — JIT-safe table lookup, never template
   interpolation. Pinned per-file by `StratifiedRenderer.alpha.test.ts`.

   Pair-rule cool-side chrome: marginalia rest border AND extension wrap
   surface both sit at `muted` (Tanya §3.4) — the reader's peripheral vision
   sees one band of marginalia, not two. The marginalia border arc steps two
   rungs (`muted` → `quiet`) on warmer; the resonance card holds at `quiet`
   always — *"this surface is precious"* (Tanya §3.3 / §4 Path A). */

/** Variant-paragraph hairline — gold thread, geometry-not-surface. */
const HAIRLINE_BORDER     = alphaClassOf('gold',       'hairline', 'border'); // border-gold/10

/** Marginalia border, warm/return state — the room noticed you. */
const MARG_BORDER_WARM    = alphaClassOf('cyan',       'quiet',    'border'); // border-cyan/70

/** Marginalia border, rest state — ambient chrome, drawn in pencil. */
const MARG_BORDER_COOL    = alphaClassOf('cyan',       'muted',    'border'); // border-cyan/30

/** Marginalia surface — cool side-of-page chrome, sibling to extension wrap. */
const MARG_SURFACE        = alphaClassOf('surface',    'muted',    'bg');     // bg-surface/30

/** Extension surface — the floor at which "this is one wrap" stays legible. */
const EXT_SURFACE         = alphaClassOf('surface',    'muted',    'bg');     // bg-surface/30

/** Resonance-marginalia surface — the killer surface, painted like one. */
const RES_SURFACE         = alphaClassOf('surface',    'quiet',    'bg');     // bg-surface/70

/** Resonance label — "Your resonance" micro-eyebrow. */
const RES_LABEL_TEXT      = alphaClassOf('rose',       'quiet',    'text');   // text-rose/70

/** Resonance quoted line — the article's words, content-not-the-content. */
const RES_QUOTE_TEXT      = alphaClassOf('foreground', 'quiet',    'text');   // text-foreground/70

/** Resonance "Saved …" timestamp — the frame around the subject. */
const RES_META_TEXT       = alphaClassOf('mist',       'recede',   'text');   // text-mist/50

/* ─── Wrap policy — `caption` rhythm, `heading` break (Mike #122 §4) ────────
   The two caption-rhythm eyebrows on this surface (extension label and the
   resonance-marginalia Your-resonance label) ride caption rhythm but
   heading break policy. Multi-word labels balance; single-word labels get
   a silent CSS no-op. The literal `typo-wrap-heading` lives in
   `wrapClassOf` only; pinned by
   `caption-heading-wrap-converges.fence.test.ts`. */
const HEADING_WRAP        = wrapClassOf('heading');

interface StratifiedRendererProps {
  blocks: ContentBlock[];
  archetype: ArchetypeKey | null;
  articleId: string;
  /** Warm mode: intensified marginalia for returning readers */
  warmer?: boolean;
}

/** Core paragraphs — plain body text with paragraph tracking IDs */
function CoreBlock({ paragraphs, prefix, offset, resolved }: {
  paragraphs: string[];
  prefix: string;
  offset: number;
  resolved?: ResolvedParagraph[];
}) {
  return (
    <div className={`space-y-sys-7 ${passageThermalClass()}`}>
      {paragraphs.map((p, i) => {
        const variant = resolved?.find(r => r.slotIndex === offset + i && r.source !== null);
        return (
          <p
            key={i}
            data-paragraph-id={`${prefix}-p${offset + i}`}
            data-variant={variant?.source ?? undefined}
            className={`text-foreground max-w-prose-ch ${variant ? `pl-sys-4 border-l-2 ${HAIRLINE_BORDER}` : ''}`}
          >
            {p.trim()}
          </p>
        );
      })}
    </div>
  );
}

/** Marginalia — returning-reader side notes with cyan border + shimmer.
 *  `shadow-cyan-whisper` is a tinted accent living OUTSIDE the six-beat
 *  ledger by design (TINTED_ACCENTS in lib/design/elevation.ts); the
 *  adoption guard allow-lists this file explicitly. */
function MarginaliaBlock({ block, warmer }: { block: ContentBlock; warmer?: boolean }) {
  const border = warmer ? MARG_BORDER_WARM : MARG_BORDER_COOL;
  const shadow = warmer ? 'shadow-cyan-whisper' : '';
  return (
    <aside
      className={`my-sys-9 pl-sys-5 border-l-2 ${border} ${MARG_SURFACE} rounded-r-sys-soft py-sys-4 pr-sys-5 ${shadow}
        ${block.isNew ? 'animate-discovery-shimmer' : ''}`}
    >
      {block.isNew && <NewContentBadge />}
      {block.paragraphs.map((p, i) => (
        <p key={i} className="text-mist italic text-sys-caption typo-caption">
          {p.trim()}
        </p>
      ))}
    </aside>
  );
}

/** Archetype extension — archetype accent border, label, shimmer on first discovery */
function ExtensionBlock({ block }: { block: ContentBlock }) {
  const key = block.layer as ArchetypeKey;
  const borderColor = getExtensionBorderColor(key);
  const label = getExtensionLabel(key);

  return (
    <section
      data-layer={block.layer}
      className={`my-sys-10 pl-sys-5 pr-sys-5 py-sys-4 rounded-r-sys-soft border-l-2 ${borderColor}
        ${block.isNew ? 'animate-discovery-shimmer' : ''}
        ${EXT_SURFACE}`}
    >
      <div className="flex items-center gap-sys-3 mb-sys-3">
        <span className={`text-sys-micro uppercase tracking-sys-caption text-cyan font-sys-accent ${HEADING_WRAP}`}>
          {label}
        </span>
        {block.isNew && <NewContentBadge label="Unlocked" />}
      </div>
      <div className="space-y-sys-5">
        {block.paragraphs.map((p, i) => (
          <p key={i} className={`text-foreground max-w-prose-ch ${passageThermalClass()}`}>
            {p.trim()}
          </p>
        ))}
      </div>
    </section>
  );
}

/**
 * enforceMarginaliaLimit — max 1 injected block after each core block.
 *
 * Priority: resonance-marginalia > archetype extension > marginalia.
 * Prevents the visual chaos of 3 stacked injected blocks per paragraph.
 */
function enforceMarginaliaLimit(blocks: ContentBlock[]): ContentBlock[] {
  const out: ContentBlock[] = [];
  let pendingCore = false;

  for (const block of blocks) {
    if (block.layer === 'core') {
      flushPending();
      out.push(block);
      pendingCore = true;
      continue;
    }
    if (!pendingCore) { out.push(block); continue; }

    // Only keep the highest-priority injected block after a core block
    const pri = injectedPriority(block.layer);
    if (pri === 0) { out.push(block); continue; }

    const existing = out[out.length - 1];
    if (existing && existing.layer !== 'core' && injectedPriority(existing.layer) >= pri) {
      out[out.length - 1] = block;  // replace lower-priority with higher
    } else {
      out.push(block);
    }
    pendingCore = false;
  }

  return out;

  function flushPending() { pendingCore = false; }
}

/** 0 = not injected, 1 = marginalia (lowest), 2 = extension, 3 = resonance */
function injectedPriority(layer: string): number {
  if (layer === 'marginalia') return 1;
  if (layer === 'resonance-marginalia') return 3;
  if (layer !== 'core') return 2;  // archetype extensions
  return 0;
}

/** Archetype-specific hover border color for paragraph micro-feedback. */
function archetypeHoverColor(key: ArchetypeKey | null): string {
  const map: Record<string, string> = {
    "deep-diver": "var(--arch-deep-diver)",
    "explorer": "var(--arch-explorer)",
    "faithful": "var(--arch-faithful)",
    "resonator": "var(--arch-resonator)",
    "collector": "var(--arch-collector)",
  };
  return map[key ?? ""] ?? "var(--fog)";
}

/** Main renderer — iterates blocks, tracks core paragraph offset for IDs */
export function StratifiedRenderer({ blocks, archetype, articleId, warmer }: StratifiedRendererProps) {
  if (!blocks.length) return null;

  const filtered = enforceMarginaliaLimit(blocks);
  let coreOffset = 0;

  return (
    <article className="stratified-content" style={{ "--archetype-hover-color": archetypeHoverColor(archetype) } as React.CSSProperties}>
      {filtered.map((block, i) => {
        if (block.layer === 'core') {
          const el = (
            <Fragment key={`core-${i}`}>
              <CoreBlock
                paragraphs={block.paragraphs}
                prefix={articleId}
                offset={coreOffset}
                resolved={block.resolvedParagraphs}
              />
            </Fragment>
          );
          coreOffset += block.paragraphs.length;
          return el;
        }
        if (block.layer === 'marginalia') {
          return <MarginaliaBlock key={`margin-${i}`} block={block} warmer={warmer} />;
        }
        if (block.layer === 'resonance-marginalia') {
          return <ResonanceMarginaliaBlock key={`res-${i}`} block={block} />;
        }
        return <ExtensionBlock key={`ext-${i}`} block={block} />;
      })}
    </article>
  );
}

/**
 * ResonanceMarginaliaBlock — the killer feature.
 * Renders the reader's own captured quote + note as warm-rose
 * marginalia woven into the article body on return visits.
 *
 * `shadow-rose-glow` is a tinted accent outside the six-beat ledger
 * (TINTED_ACCENTS in lib/design/elevation.ts); rose = *remembered*,
 * the reader's own voice speaking back. Allow-listed per-file.
 */
function ResonanceMarginaliaBlock({ block }: { block: ContentBlock }) {
  const data = block.resonance;
  if (!data) return null;

  // Path A (Tanya UIX §4): one base `shadow-rose-glow`, always on. The
  // killer surface is precious on every visit; intensity differs (warmer
  // is the system's job), presence does not. The pre-snap doubled the
  // shadow-rose-glow token in the same string when warmer — Tailwind
  // deduped the class so the pixel was unchanged, but the *intent* was
  // muddled. One shadow, one address, one read.
  return (
    <aside
      className={`my-sys-10 px-sys-6 py-sys-5 ${RES_SURFACE} border-l-4 border-rose rounded-sys-medium shadow-rose-glow
        ${block.isNew ? 'animate-resonance-remembered' : ''}`}
    >
      <p className={`text-sys-micro uppercase tracking-sys-caption ${RES_LABEL_TEXT} ${HEADING_WRAP} mb-sys-4`}>
        Your resonance
      </p>
      <p className={`text-sys-body ${RES_QUOTE_TEXT} italic ${passageThermalClass()}`}>
        &ldquo;{data.quote}&rdquo;
      </p>
      {/* Resonance-marginalia inner divider — the comma between the quoted
          line and the reader's note. Routes through the `Divider.Static`
          kernel so the geometry/alpha pair-rule stays one address (Mike
          napkin #37 §1, divider-fence Axis A). Pre-snap was a raw
          h-px / max-w-divider / my-sys-4 literal at the gold/hairline rung
          — the sibling drift retired at the same time the geometry did. */}
      <Divider.Static spacing="sys-4" />
      <p className={`text-sys-body text-rose italic ${passageThermalClass()}`}>
        {data.note}
      </p>
      <p className={`text-sys-micro ${RES_META_TEXT} mt-sys-4`}>
        Saved {data.createdAt}
      </p>
    </aside>
  );
}

// ─── Test seam — pure handles for the per-file SSR alpha pin ─────────────
//
// Mirrors `ResonanceEntry.__testing__` (Mike napkin #117 / #111 §4 — same
// shape, same discipline). Tiny named handles let
// `StratifiedRenderer.alpha.test.ts` assert against canonical
// `alphaClassOf(...)` literals AND wire strings. A future swap of the rung
// vocabulary cannot silently shift any register without flipping the
// per-file pin. This is the LAST of the eleven graduations — when the
// grandfather array empties, the fence is structural; the test below this
// export becomes the doctrine.
export const __testing__ = {
  HAIRLINE_BORDER,
  MARG_BORDER_WARM,
  MARG_BORDER_COOL,
  MARG_SURFACE,
  EXT_SURFACE,
  RES_SURFACE,
  RES_LABEL_TEXT,
  RES_QUOTE_TEXT,
  RES_META_TEXT,
  // Internal sub-renderers, exposed for SSR pinning.
  MarginaliaBlock,
  ExtensionBlock,
  ResonanceMarginaliaBlock,
} as const;
