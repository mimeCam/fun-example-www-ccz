/**
 * StratifiedRenderer — renders article content in visible layers.
 *
 * Core is always shown. Marginalia appears for returning readers.
 * Archetype extensions fade in with a gold shimmer on first discovery.
 * NewContentBadge marks first-time reveals with a ✦ icon.
 *
 * Core paragraphs carry data-paragraph-id for the engagement tracking pipeline.
 */

'use client';

import { Fragment } from 'react';
import type { ArchetypeKey } from '@/types/content';
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
}

/** Core paragraphs — plain body text with paragraph tracking IDs */
function CoreBlock({ paragraphs, prefix, offset }: {
  paragraphs: string[];
  prefix: string;
  offset: number;
}) {
  return (
    <div className="space-y-6 leading-[1.75]">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          data-paragraph-id={`${prefix}-p${offset + i}`}
          className="text-[#f0f0f5] max-w-[65ch]"
        >
          {p.trim()}
        </p>
      ))}
    </div>
  );
}

/** Marginalia — returning-reader side notes with cyan border + shimmer */
function MarginaliaBlock({ block }: { block: ContentBlock }) {
  return (
    <aside
      className={`my-8 pl-4 border-l-2 border-l-[#6ec6ca]/40 bg-[#242445]/30 rounded-r-md py-3 pr-4
        ${block.isNew ? 'discovery-shimmer' : ''}`}
    >
      {block.isNew && <NewContentBadge />}
      {block.paragraphs.map((p, i) => (
        <p key={i} className="text-[#9494b8] italic text-sm leading-relaxed">
          {p.trim()}
        </p>
      ))}
    </aside>
  );
}

/** Archetype extension — gold border, label, shimmer on first discovery */
function ExtensionBlock({ block }: { block: ContentBlock }) {
  const key = block.layer as ArchetypeKey;
  const borderColor = getExtensionBorderColor(key);
  const label = getExtensionLabel(key);

  return (
    <section
      data-layer={block.layer}
      className={`my-8 pl-4 pr-4 py-3 rounded-r-md border-l-2 ${borderColor}
        ${block.isNew ? 'discovery-shimmer' : ''}
        bg-[#242445]/20`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs uppercase tracking-widest text-[#6ec6ca] font-medium">
          {label}
        </span>
        {block.isNew && <NewContentBadge label="Unlocked" />}
      </div>
      <div className="space-y-4">
        {block.paragraphs.map((p, i) => (
          <p key={i} className="text-[#f0f0f5] max-w-[65ch] leading-[1.75]">
            {p.trim()}
          </p>
        ))}
      </div>
    </section>
  );
}

/** Main renderer — iterates blocks, tracks core paragraph offset for IDs */
export function StratifiedRenderer({ blocks, articleId }: StratifiedRendererProps) {
  if (!blocks.length) return null;

  let coreOffset = 0;

  return (
    <article className="stratified-content">
      {blocks.map((block, i) => {
        if (block.layer === 'core') {
          const el = (
            <Fragment key={`core-${i}`}>
              <CoreBlock paragraphs={block.paragraphs} prefix={articleId} offset={coreOffset} />
            </Fragment>
          );
          coreOffset += block.paragraphs.length;
          return el;
        }
        if (block.layer === 'marginalia') {
          return <MarginaliaBlock key={`margin-${i}`} block={block} />;
        }
        return <ExtensionBlock key={`ext-${i}`} block={block} />;
      })}
    </article>
  );
}
