'use client';

import { useState } from 'react';
import type { FilterCriteria } from '@/types/filter';

interface FilterBannerProps {
  filter: FilterCriteria;
  onAccept: () => void;
  onReject: () => void;
}

export function FilterBanner({ filter, onAccept, onReject }: FilterBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-l-4 border-primary bg-surface rounded-r-lg p-6 mb-8">
      <div className="max-w-4xl">
        {/* Main teaser - always visible */}
        <div className="mb-4">
          <p className="text-lg font-display font-semibold text-accent mb-2">
            {filter.teaser}
          </p>
          <h3 className="text-2xl font-bold text-white mb-4">
            {filter.title}
          </h3>
          <p className="text-gray-300 mb-4">
            {filter.description}
          </p>
        </div>

        {/* Expandable beliefs section */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary hover:text-accent transition-colors mb-4"
        >
          {isExpanded ? '▼ Show less' : '▶ See if this resonates'}
        </button>

        {isExpanded && (
          <ul className="space-y-2 mb-6">
            {filter.beliefs.map((belief, index) => (
              <li key={index} className="flex items-start text-gray-300">
                <span className="text-accent mr-2">•</span>
                <span>{belief}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onAccept}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors font-medium"
          >
            Yes, this is for me
          </button>
          <button
            onClick={onReject}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-medium"
          >
            Not your vibe? No worries
          </button>
        </div>
      </div>
    </div>
  );
}
