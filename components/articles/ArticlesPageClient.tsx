'use client';

import Link from 'next/link';
import { Article } from '@/lib/content/ContentTagger';
import { FilterType, FILTER_TEMPLATES } from '@/types/filter';
import ExploreArticleCard from '@/components/explore/ExploreArticleCard';

interface Props {
  articles: Article[];
  activeFilter: FilterType | null;
}

const TABS: { label: string; type: FilterType | null }[] = [
  { label: 'All', type: null },
  { label: 'Technical', type: 'technical' },
  { label: 'Philosophical', type: 'philosophical' },
  { label: 'Practical', type: 'practical' },
  { label: 'Contrarian', type: 'contrarian' },
];

function tabHref(type: FilterType | null): string {
  return type ? `/articles?type=${type}` : '/articles';
}

function tabActive(tab: FilterType | null, current: FilterType | null): boolean {
  return tab === current;
}

export default function ArticlesPageClient({ articles, activeFilter }: Props) {
  const tpl = activeFilter ? FILTER_TEMPLATES[activeFilter] : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-10">
        <h1 className="font-display text-foreground text-2xl md:text-3xl font-bold">
          Articles
        </h1>
        <p className="text-mist text-sm italic mt-1">
          Writing that pays attention back.
        </p>
        {tpl && (
          <p className="text-mist text-sm mt-2">{tpl.description}</p>
        )}
      </header>

      {/* Filter tabs */}
      <nav className="flex gap-1 border-b border-fog/20 mb-8" aria-label="Worldview filters">
        {TABS.map(({ label, type }) => (
          <Link
            key={label}
            href={tabHref(type)}
            className={`px-3 py-2 text-xs tracking-wide transition-colors border-b-2 -mb-px ${
              tabActive(type, activeFilter)
                ? 'border-gold text-gold'
                : 'border-transparent text-mist/50 hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Belief banners */}
      {tpl && (
        <div className="mb-8 space-y-1">
          {tpl.beliefs.map((b, i) => (
            <p key={i} className="text-gold/60 text-xs italic">{b}</p>
          ))}
        </div>
      )}

      {/* Article grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map(article => (
            <ExploreArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-mist/60 text-sm">No articles found.</p>
          <Link href="/articles" className="text-gold/60 hover:text-gold text-xs mt-2 inline-block">
            View all articles
          </Link>
        </div>
      )}

      {/* Article count */}
      <p className="text-mist/40 text-xs mt-8">
        {articles.length} {articles.length === 1 ? 'article' : 'articles'}
      </p>
    </div>
  );
}
