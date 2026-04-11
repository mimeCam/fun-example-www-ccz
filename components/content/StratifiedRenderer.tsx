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

import { Fragment, type ReactNode } from 'react';
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
  /** Optional ReactNode to inject at the block with layer='quick-mirror' */
  mirrorSlot?: ReactNode;
}

/** Core paragraphs — plain body text with paragraph tracking IDs */
function CoreBlock({ paragraphs, prefix, offset, resolved }: {
  paragraphs: string[];
  prefix: string;
  offset: number;
  resolved?: ResolvedParagraph[];
}) {
  return (
    <div className="space-y-6 leading-[1.75]">
      {paragraphs.map((p, i) => {
        const variant = resolved?.find(r => r.slotIndex === offset + i && r.source !== null);
        return (
          <p
            key={i}
            data-paragraph-id={`${prefix}-p${offset + i}`}
            data-variant={variant?.source ?? undefined}
            className={`text-foreground max-w-[65ch] ${variant ? 'pl-3 border-l-2 border-gold/30' : ''}`}
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
      className={`my-8 pl-4 border-l-2 ${border} bg-surface/30 rounded-r-md py-3 pr-4 ${shadow}
        ${block.isNew ? 'animate-discovery-shimmer' : ''}`}
    >
      {block.isNew && <NewContentBadge />}
      {block.paragraphs.map((p, i) => (
        <p key={i} className={`text-mist italic text-sm leading-relaxed`}>
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
      className={`my-8 pl-4 pr-4 py-3 rounded-r-md border-l-2 ${borderColor}
        ${block.isNew ? 'animate-discovery-shimmer' : ''}
        bg-surface/20`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs uppercase tracking-widest text-cyan font-medium">
          {label}
        </span>
        {block.isNew && <NewContentBadge label="Unlocked" />}
      </div>
      <div className="space-y-4">
        {block.paragraphs.map((p, i) => (
          <p key={i} className="text-foreground max-w-[65ch] leading-[1.75]">
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
    "deep-diver": "rgba(78, 205, 196, 0.15)",
    "explorer": "rgba(199, 125, 255, 0.15)",
    "faithful": "rgba(157, 78, 221, 0.15)",
    "resonator": "rgba(232, 143, 167, 0.15)",
    "collector": "rgba(240, 198, 116, 0.15)",
  };
  return map[key ?? ""] ?? "rgba(34, 34, 68, 0.10)";
}

/** Main renderer — iterates blocks, tracks core paragraph offset for IDs */
export function StratifiedRenderer({ blocks, archetype, articleId, warmer, mirrorSlot }: StratifiedRendererProps) {
  if (!blocks.length) return null;

  const filtered = enforceMarginaliaLimit(blocks);
  let coreOffset = 0;

  return (
    <article className="stratified-content" style={{ "--archetype-hover-color": archetypeHoverColor(archetype) } as React.CSSProperties}>
      {filtered.map((block, i) => {
        if (block.layer === 'quick-mirror') {
          return <Fragment key={`mirror-${i}`}>{mirrorSlot ?? null}</Fragment>;
        }
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

  const scale = warmer ? 'scale-[1.01]' : '';
  const glow = warmer ? 'shadow-[0_0_25px_rgba(232,143,167,0.2)]' : '';

  return (
    <aside
      className={`my-8 p-5 bg-surface/60 border-l-4 border-rose rounded-lg shadow-rose-glow ${scale} ${glow}
        ${block.isNew ? 'animate-resonance-remembered' : ''}`}
    >
      <p className="text-xs uppercase tracking-widest text-rose/70 mb-3">
        Your resonance
      </p>
      <p className="text-[0.9375rem] text-foreground/70 italic leading-[1.7]">
        &ldquo;{data.quote}&rdquo;
      </p>
      <div className="h-px bg-gold/30 max-w-[120px] my-3" />
      <p className="text-[0.9375rem] text-rose italic leading-[1.7]">
        {data.note}
      </p>
      <p className="text-xs text-mist/50 mt-3">
        Saved {data.createdAt}
      </p>
    </aside>
  );
}
