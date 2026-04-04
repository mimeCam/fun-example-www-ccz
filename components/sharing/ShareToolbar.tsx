'use client';

import { useEffect, useRef } from 'react';
import { formatBlockquote, formatForTwitter, cleanText } from '@/lib/sharing/text-utils';
import { copyWithFeedback } from '@/lib/sharing/clipboard-utils';
import { generateShareLink } from '@/lib/sharing/share-links';

interface ShareToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  articleTitle: string;
  articleUrl: string;
  authorName?: string;
  onClose: () => void;
}

/**
 * Share toolbar that appears near text selection.
 * Offers options to copy quote with attribution or share a permalink.
 */
export function ShareToolbar({
  isVisible,
  position,
  selectedText,
  articleTitle,
  articleUrl,
  authorName = 'Author Name',
  onClose,
}: ShareToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close toolbar on click outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  // Handle copy with attribution
  const handleCopy = async () => {
    const cleanedText = cleanText(selectedText);
    const attribution = `${authorName}, "${articleTitle}"`;

    const quote = formatBlockquote({
      text: cleanedText,
      attribution,
      url: articleUrl,
    });

    await copyWithFeedback(quote, 'Quote copied!');
    onClose();
  };

  // Handle copy as tweet
  const handleTweet = async () => {
    const cleanedText = cleanText(selectedText);
    const attribution = authorName;

    const tweet = formatForTwitter({
      text: cleanedText,
      attribution,
      url: articleUrl,
    });

    await copyWithFeedback(tweet, 'Tweet copied!');
    onClose();
  };

  // Handle share permalink
  const handleShareLink = async () => {
    const cleanedText = cleanText(selectedText);

    // Generate shareable link with highlight fragment
    const shareLink = generateShareLink(articleUrl, cleanedText);

    await copyWithFeedback(shareLink, 'Shareable link copied!');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-fadeIn"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%) translateY(-100%)',
      }}
    >
      <div className="bg-surface border border-gray-600 rounded-lg shadow-lg px-3 py-2 mb-2 flex items-center gap-2">
        <span className="text-sm text-gray-300 mr-2">Share quote</span>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded hover:bg-blue-500/30 transition-colors border border-blue-500/40 flex items-center gap-1"
            title="Copy as formatted quote"
          >
            <span>📋</span>
            <span>Copy</span>
          </button>

          <button
            onClick={handleTweet}
            className="px-3 py-1.5 bg-sky-500/20 text-sky-400 text-xs font-medium rounded hover:bg-sky-500/30 transition-colors border border-sky-500/40 flex items-center gap-1"
            title="Copy as tweet"
          >
            <span>𝕏</span>
            <span>Tweet</span>
          </button>

          <button
            onClick={handleShareLink}
            className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-medium rounded hover:bg-green-500/30 transition-colors border border-green-500/40 flex items-center gap-1"
            title="Copy link"
          >
            <span>🔗</span>
            <span>Link</span>
          </button>

          <button
            onClick={onClose}
            className="px-2 py-1.5 text-gray-400 text-xs rounded hover:text-gray-200 hover:bg-gray-700/50 transition-colors"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Arrow */}
      <div
        className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-600 mx-auto"
        style={{ borderTopColor: 'rgb(75, 85, 99)' }}
      />
    </div>
  );
}

// TODO: Add keyboard shortcuts (C for copy, T for tweet, L for link)
// TODO: Add QR code option for mobile
// TODO: Add more social platforms (LinkedIn, Reddit, etc.)
