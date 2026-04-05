import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllArticles } from '@/lib/content/articleData';
import { FILTER_TEMPLATES, FilterType } from '@/types/filter';
import { estimateReadingTime } from '@/lib/content/ContentTagger';

interface WorldviewPageProps {
  params: {
    type: string;
  };
}

export default function WorldviewPage({ params }: WorldviewPageProps) {
  const worldviewType = params.type as FilterType;

  // Validate worldview type
  if (!FILTER_TEMPLATES[worldviewType]) {
    notFound();
  }

  const filterTemplate = FILTER_TEMPLATES[worldviewType];
  const allArticles = getAllArticles();

  // Filter articles by worldview
  const worldviewArticles = allArticles.filter(
    article => article.worldview === worldviewType
  );

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header section */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-primary hover:text-accent transition-colors mb-4 inline-block"
          >
            ← Back to Home
          </Link>

          <div className="mb-6">
            <span className="text-xs uppercase tracking-wider text-accent font-semibold">
              {filterTemplate.type}
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2 mb-4">
              {filterTemplate.title}
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {filterTemplate.description}
            </p>

            <div className="bg-surface border border-surface rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-500 mb-3">This worldview is for people who believe...</p>
              <ul className="space-y-2">
                {filterTemplate.beliefs.map((belief, index) => (
                  <li key={index} className="text-gray-300 flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{belief}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-gray-400">
            {worldviewArticles.length} {worldviewArticles.length === 1 ? 'article' : 'articles'} in this worldview
          </p>
        </div>

        {/* Articles grid */}
        {worldviewArticles.length > 0 ? (
          <div className="grid gap-6">
            {worldviewArticles.map(article => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="block bg-surface border border-surface hover:border-primary rounded-lg p-6 transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-2xl font-display font-bold text-white group-hover:text-accent transition-colors">
                    {article.title}
                  </h2>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {estimateReadingTime(article.content)} min read
                  </span>
                </div>

                <p className="text-gray-400 mb-4 line-clamp-3">
                  {article.content.substring(0, 200)}...
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {article.tags?.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-primary/20 text-primary rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <span className="text-primary font-medium text-sm">
                    Read more →
                  </span>
                </div>

                {article.questions && article.questions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Explore this question:</p>
                    <p className="text-sm text-gray-300 italic">
                      {article.questions[0]}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-surface rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">
              No articles found for this worldview yet.
            </p>
            <p className="text-gray-500">
              Check back soon for new content, or explore a different worldview.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="text-center text-gray-500 text-sm">
            <p className="mb-4">Explore other worldviews:</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {(Object.keys(FILTER_TEMPLATES) as FilterType[]).map(type => {
                if (type === worldviewType) return null;
                const template = FILTER_TEMPLATES[type];
                return (
                  <Link
                    key={type}
                    href={`/worldview/${type}`}
                    className="text-primary hover:text-accent transition-colors"
                  >
                    {template.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Generate static params for all worldview types
export function generateStaticParams() {
  return Object.keys(FILTER_TEMPLATES).map(type => ({
    type: type,
  }));
}
