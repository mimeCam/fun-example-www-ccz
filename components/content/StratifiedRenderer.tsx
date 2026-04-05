/**
 * StratifiedRenderer — renders article content in visible layers.
 *
 * Core is always shown. Marginalia appears for returning readers.
 * Archetype extensions fade in with a gold shimmer on first discovery.
 *
 * Takes pre-resolved ContentBlock[] from content-layers.ts,
 * renders each with appropriate visual treatment.
 */

'use client';

import type { ArchetypeKey } from '@/types/content';
import type { ContentBlock } from '@/lib/content/content-layers';
import {
  getExtensionLabel,
  getExtensionBorderColor,
} from '@/lib/content/content-layers';

interface StratifiedRendererProps {
  blocks: ContentBlock[];
  archetype: ArchetypeKey | null;
}

/** Render a single content block with its visual treatment */
function ContentBlockView({ block }: { block: ContentBlock }) {
  if (block.layer === 'core') return <CoreBlock paragraphs={block.paragraphs} />;
  if (block.layer === 'marginalia') return <MarginaliaBlock paragraphs={block.paragraphs} />;
  return <ExtensionBlock block={block} />;
}

/** Core paragraphs — plain body text, the article foundation */
function CoreBlock({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-6 leading-[1.75]">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[#f0f0f5] max-w-[65ch]">{p.trim()}</p>
      ))}
    </div>
  );
}

/** Marginalia — returning-reader side notes with whisper cyan left border */
function MarginaliaBlock({ paragraphs }: { paragraphs: string[] }) {
  return (
    <aside className="my-8 pl-4 border-l-2 border-l-[#6ec6ca]/40 bg-[#242445]/30 rounded-r-md py-3 pr-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[#9494b8] italic text-sm leading-relaxed">
          {p.trim()}
        </p>
      ))}
    </aside>
  );
}

/** Archetype extension — varies by archetype, gold shimmer on first view */
function ExtensionBlock({ block }: { block: ContentBlock }) {
  const key = block.layer as ArchetypeKey;
  const borderColor = getExtensionBorderColor(key);
  const label = getExtensionLabel(key);
  const isNew = block.isNew;

  return (
    <section
      data-layer={block.layer}
      className={`my-8 pl-4 pr-4 py-3 rounded-r-md border-l-2 ${borderColor}
        ${isNew ? 'animate-[shimmerReveal_10s_ease-out_forwards]' : ''}
        bg-[#242445]/20`}
    >
      <span className="text-xs uppercase tracking-widest text-[#6ec6ca] font-medium block mb-2">
        {label}
      </span>
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

/** Main renderer — iterates blocks in order */
export function StratifiedRenderer({ blocks, archetype }: StratifiedRendererProps) {
  if (!blocks.length) return null;

  return (
    <article className="stratified-content">
      {blocks.map((block, i) => (
        <ContentBlockView key={`${block.layer}-${i}`} block={block} />
      ))}
    </article>
  );
}
