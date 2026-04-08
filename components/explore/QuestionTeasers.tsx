'use client';

import Link from 'next/link';
import { QuestionWithArticle } from '@/lib/content/questionUtils';

interface QuestionTeasersProps {
  questions: QuestionWithArticle[];
}

export default function QuestionTeasers({ questions }: QuestionTeasersProps) {
  if (questions.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display text-foreground text-xl font-semibold">
          By Question
        </h2>
        <div className="flex-1 h-px bg-fog/40" />
      </div>

      <ul className="space-y-3">
        {questions.map((q, i) => (
          <li key={i}>
            <Link
              href={`/article/${q.articleId}`}
              className="flex items-center justify-between gap-4 py-2 group"
            >
              <span className="text-foreground group-hover:text-gold transition-colors">
                &ldquo;{q.question}&rdquo;
              </span>
              <span className="text-mist/40 group-hover:text-mist transition-colors text-sm whitespace-nowrap">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
