'use client';

import type { FilterCriteria } from '@/types/filter';

interface FilterModalProps {
  filter: FilterCriteria;
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function FilterModal({ filter, isOpen, onConfirm, onClose }: FilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-xl p-8 max-w-2xl w-full shadow-2xl border border-surface">
        {/* Header */}
        <div className="mb-6">
          <span className="text-xs uppercase tracking-wider text-accent font-semibold">
            Before you continue
          </span>
          <h2 className="text-3xl font-display font-bold text-white mt-2 mb-4">
            {filter.title}
          </h2>
        </div>

        {/* Main description */}
        <div className="mb-6">
          <p className="text-xl text-gray-300 mb-4">
            {filter.teaser}
          </p>
          <p className="text-gray-400">
            {filter.description}
          </p>
        </div>

        {/* Beliefs checklist */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            This post assumes you believe:
          </h3>
          <ul className="space-y-3">
            {filter.beliefs.map((belief, index) => (
              <li key={index} className="flex items-start text-gray-300">
                <span className="text-accent mr-3 text-lg">✓</span>
                <span className="leading-relaxed">{belief}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Confirmation warning */}
        <div className="bg-surface rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400">
            <strong className="text-white">Note:</strong> This content is designed for people
            who align with these perspectives. If that's not you, you won't get much value from it.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-medium"
          >
            Take me back
          </button>
          <button
            onClick={onConfirm}
            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors font-semibold"
          >
            I understand, let me read
          </button>
        </div>
      </div>
    </div>
  );
}
