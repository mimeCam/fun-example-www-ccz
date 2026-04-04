/**
 * TrustedFilterSection Component
 *
 * Displays contextual information about the article and related perspectives.
 * This positions the author as a curator who respects reader time.
 */

'use client';

import Link from 'next/link';
import { TrustedFilterData, PERSPECTIVE_TYPE_CONFIG } from '@/types/trusted-filter';

interface TrustedFilterSectionProps {
  data: TrustedFilterData;
}

/**
 * External link icon component
 */
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

/**
 * Main component
 */
export function TrustedFilterSection({ data }: TrustedFilterSectionProps) {
  if (!data.perspectives || data.perspectives.length === 0) {
    return null;
  }

  return (
    <section
      className="mb-8 p-6 rounded-lg border border-gray-700 bg-gray-800/30 backdrop-blur-sm"
      aria-label="Trusted perspectives"
    >
      {/* Filter Context */}
      <div className="mb-6 pb-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-primary mb-3">About this article</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>
            <span className="font-medium text-gray-200">Who this is for:</span>{' '}
            {data.context.targetAudience}
          </p>
          <p>
            <span className="font-medium text-gray-200">What you'll get:</span>{' '}
            {data.context.valuePromise}
          </p>
          {data.context.timeCommitment && (
            <p className="text-gray-400">
              <span className="font-medium text-gray-200">Time investment:</span>{' '}
              {data.context.timeCommitment}
            </p>
          )}
        </div>
      </div>

      {/* Related Perspectives */}
      <div>
        <h3 className="text-lg font-semibold text-primary mb-3">
          Related perspectives
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Explore these viewpoints to deepen your understanding:
        </p>
        <ul className="space-y-3">
          {data.perspectives.map((perspective, index) => {
            const typeConfig = perspective.type
              ? PERSPECTIVE_TYPE_CONFIG[perspective.type]
              : null;

            return (
              <li key={`${perspective.url}-${index}`}>
                <Link
                  href={perspective.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-4 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-700 hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-100 group-hover:text-primary transition-colors">
                          {perspective.title}
                        </h4>
                        <ExternalLinkIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-400 flex-shrink-0" />
                      </div>
                      {perspective.author && (
                        <p className="text-xs text-gray-500 mb-2">
                          by {perspective.author}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {perspective.description}
                      </p>
                      {typeConfig && (
                        <span
                          className={`inline-block mt-2 text-xs ${typeConfig.color} font-medium`}
                        >
                          {typeConfig.label}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
