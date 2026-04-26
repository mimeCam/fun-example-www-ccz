/**
 * NextRead — Archetype-Aware "Next Read" Recommendation
 *
 * Whisper, not billboard — gentle suggestion at the article's end.
 * Ceremony-aware: defers visibility to the CeremonySequencer.
 * Shows ONE recommendation with context about WHY.
 *
 * Per-archetype border + text + glyph live in
 * `lib/design/archetype-accents.ts` — single typed home keyed by
 * `ArchetypeKey`. Mike napkin #96 / Tanya UX #22.
 */

'use client';

import { useState, useEffect } from 'react';
import { Article } from '@/lib/content/ContentTagger';
import type { ArchetypeKey } from '@/types/content';
import { useCeremony } from './CeremonySequencer';
import { TextLink } from '@/components/shared/TextLink';
import {
  archetypeAccentClass,
  archetypeLabel,
  archetypeAccentGlyph,
  archetypeAccentGlyphClass,
} from '@/lib/design/archetype-accents';

interface NextReadProps {
  article: Article;
  context: string;
  archetype?: ArchetypeKey | null;
}

export function NextRead({ article, context, archetype }: NextReadProps) {
  if (!article) return null;

  const { phase } = useCeremony();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (phase === 'gifting' || phase === 'settled') {
      setVisible(true);
    }
  }, [phase]);

  if (!visible) return null;

  // Tanya UX #22 §5 #5 — fallback is silent: the chip suppresses entirely
  // when no archetype has been resolved yet. The empty-string from
  // `archetypeLabel(undefined|null)` flips this gate to false.
  const label = archetypeLabel(archetype);

  return (
    <div data-next-read className="py-sys-7 animate-fade-in">
      {/* "UP NEXT" label + archetype badge */}
      <div className="mb-sys-4 flex items-center gap-sys-4">
        <span className="text-sys-micro tracking-sys-caption uppercase text-mist/50 font-sys-accent">
          Up Next
        </span>
        {label && (
          /* Tanya UX #22 §3.4: glyph leadin (principle #7 — don't rely on
             color alone). `aria-hidden` so a screen reader hears the
             label, not the shape name. Per-glyph optical lift via
             `archetypeAccentGlyphClass` — `◉` and `❒` are filled and
             visibly sink vs the line glyphs at `text-sys-micro`.

             Tanya UX #62 §4.2 (extension #100 §2.3): `align-baseline`
             keeps the rounded `py-sys-1` chip on the same x-height as
             the `font-sys-accent` "Up Next" kicker — the symmetric fix
             to the worldview chip's metadata-row landing. Without it
             the pill leaves a 1px optical drop against the kicker. */
          <span
            className={`text-sys-micro tracking-sys-caption font-sys-accent border rounded-sys-full px-sys-3 py-sys-1 align-baseline ${archetypeAccentClass(archetype)}`}
          >
            <span aria-hidden="true" className={archetypeAccentGlyphClass(archetype)}>
              {archetypeAccentGlyph(archetype)}
            </span>
            For the {label}
          </span>
        )}
      </div>

      {/* Article title */}
      <h3 className="text-sys-xl font-sys-heading text-foreground mb-sys-2 typo-heading">
        {article.title}
      </h3>

      {/* Context — WHY this article was recommended.
          Tanya UX #80 + Mike napkin #96 §7 #4: snapped the legacy /60 alpha
          on this line to `/50` (the `recede` rung — "frame around the
          subject"). The context line IS the frame around the next-read
          subject; the rung now matches its UX role. One drift retired
          with the lift. */}
      <p className="text-sys-caption text-mist/50 mb-sys-4 typo-caption">
        {context}
      </p>

      {/* CTA — the showcase `passage` moment: reader hovers → feels
          the destination room's temperature before the click. */}
      <TextLink
        variant="passage"
        href={`/article/${article.id}`}
        className="text-sys-caption font-sys-accent"
      >
        Read this next →
      </TextLink>
    </div>
  );
}
