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
import { NewContentBadge } from './NewContentBadge';

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
    <div className="space-y-sys-7 leading-[var(--token-line-height)]">
      {paragraphs.map((p, i) => {
        const variant = resolved?.find(r => r.slotIndex === offset + i && r.source !== null);
        return (
          <p
            key={i}
            data-paragraph-id={`${prefix}-p${offset + i}`}
            data-variant={variant?.source ?? undefined}
            className={`text-foreground max-w-prose-ch ${variant ? 'pl-sys-4 border-l-2 border-gold/20' : ''}`}
          >
            {p.trim()}
          </p>
        );
      })}
    </div>
  );
}

/** Marginalia — returning-reader side notes with cyan border + shimmer */
function MarginaliaBlock({ block, warmer }: { block: ContentBlock; warmer?: boolean }) {
  const border = warmer ? 'border-l-cyan/70' : 'border-l-cyan/40';
  const shadow = warmer ? 'shadow-cyan-whisper' : '';
  return (
    <aside
      className={`my-sys-9 pl-sys-5 border-l-2 ${border} bg-surface/30 rounded-r-sys-soft py-sys-4 pr-sys-5 ${shadow}
        ${block.isNew ? 'animate-discovery-shimmer' : ''}`}
    >
      {block.isNew && <NewContentBadge />}
      {block.paragraphs.map((p, i) => (
        <p key={i} className={`text-mist italic text-sys-caption leading-relaxed`}>
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
        bg-surface/20`}
    >
      <div className="flex items-center gap-sys-3 mb-sys-3">
        <span className="text-sys-micro uppercase tracking-widest text-cyan font-sys-accent">
          {label}
        </span>
        {block.isNew && <NewContentBadge label="Unlocked" />}
      </div>
      <div className="space-y-sys-5">
        {block.paragraphs.map((p, i) => (
          <p key={i} className="text-foreground max-w-prose-ch leading-[var(--token-line-height)]">
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
          return <ResonanceMarginaliaBlock key={`res-${i}`} block={block} warmer={warmer} />;
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
 */
function ResonanceMarginaliaBlock({ block, warmer }: { block: ContentBlock; warmer?: boolean }) {
  const data = block.resonance;
  if (!data) return null;

  const glow = warmer ? 'shadow-rose-glow' : '';

  return (
    <aside
      className={`my-sys-10 px-sys-6 py-sys-5 bg-surface/60 border-l-4 border-rose rounded-sys-medium shadow-rose-glow ${glow}
        ${block.isNew ? 'animate-resonance-remembered' : ''}`}
    >
      <p className="text-sys-micro uppercase tracking-widest text-rose/70 mb-sys-4">
        Your resonance
      </p>
      <p className="text-sys-body text-foreground/70 italic leading-[var(--token-line-height)]">
        &ldquo;{data.quote}&rdquo;
      </p>
      <div className="h-px bg-gold/20 max-w-divider my-sys-4" />
      <p className="text-sys-body text-rose italic leading-[var(--token-line-height)]">
        {data.note}
      </p>
      <p className="text-sys-micro text-mist/50 mt-sys-4">
        Saved {data.createdAt}
      </p>
    </aside>
  );
}
