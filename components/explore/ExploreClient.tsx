'use client';

import { useState, useEffect } from 'react';
import { Article } from '@/lib/content/ContentTagger';
import { Trail } from '@/types/trail';
import { QuestionWithArticle } from '@/lib/content/questionUtils';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import ExploreHeader from './ExploreHeader';
import ArchetypeCuratedSection from './ArchetypeCuratedSection';
import TrailCards from './TrailCards';
import QuestionTeasers from './QuestionTeasers';
import AllArticlesGrid from './AllArticlesGrid';

interface ExploreClientProps {
  articles: Article[];
  trails: Trail[];
  questions: QuestionWithArticle[];
}

export default function ExploreClient({
  articles,
  trails,
  questions,
}: ExploreClientProps) {
  const { archetype, recognitionTier, lastWhisper, visitCount } =
    useReturnRecognition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const showCurated =
    archetype && recognitionTier !== 'stranger';
  const showTrailProgress =
    recognitionTier === 'known' && visitCount > 2;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <ExploreHeader
        tier={recognitionTier}
        archetype={archetype}
        whisper={lastWhisper}
      />

      {showCurated && (
        <ArchetypeCuratedSection
          articles={articles}
          archetype={archetype}
        />
      )}

      <TrailCards trails={showTrailProgress ? trails : trails.slice(0, 2)} />

      <QuestionTeasers questions={questions} />

      <AllArticlesGrid articles={articles} />
    </div>
  );
}
