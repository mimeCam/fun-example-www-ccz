'use client';

import { useEffect, useRef, useState } from 'react';
import { cleanText } from '@/lib/sharing/text-utils';
import { ShareModal } from './ShareModal';
import { QuoteCardModal } from './QuoteCardModal';
import { ShareContent } from '@/lib/sharing/platform-formatters';

interface ShareButtonProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  articleTitle: string;
  articleUrl: string;
  authorName?: string;
  tags?: string[];
  onClose: () => void;
}

/**
 * Enhanced share button - single floating icon with platform modal.
 * Appears on text selection, opens share modal on click.
 * Auto-dismisses after 3s or on scroll (per UIX principles).
 */
export function ShareButton({
  isVisible,
  position,
  selectedText,
  articleTitle,
  articleUrl,
  authorName = 'Author Name',
  tags,
  onClose,
}: ShareButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuoteCardModalOpen, setIsQuoteCardModalOpen] = useState(false);
  const autoDismissRef = useRef<NodeJS.Timeout>();

  // Auto-dismiss after 3 seconds (if modal not open)
  useEffect(() => {
    if (!isVisible || isModalOpen) {
      clearTimeout(autoDismissRef.current);
      return;
    }

    autoDismissRef.current = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(autoDismissRef.current);
  }, [isVisible, isModalOpen, onClose]);

  // Dismiss on scroll (but keep modal open if selected)
  useEffect(() => {
    if (!isVisible || isModalOpen) return;

    const handleScroll = () => onClose();

    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll, true);
  }, [isVisible, isModalOpen, onClose]);

  // Close on click outside (but not if modal is open)
  useEffect(() => {
    if (!isVisible || isModalOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, isModalOpen, onClose]);

  // Open share modal
  const handleShareClick = () => {
    setIsModalOpen(true);
  };

  // Open quote card modal
  const handleQuoteCardClick = () => {
    setIsQuoteCardModalOpen(true);
    setIsModalOpen(false);
  };

  // Prepare share content
  const shareContent: ShareContent = {
    text: cleanText(selectedText),
    articleTitle,
    articleUrl,
    authorName,
    tags,
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <>
      <div
        ref={buttonRef}
        className="fixed z-50 animate-fadeIn"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        {/* Translucent floating button with icon only */}
        <div className="relative">
          <button
            onClick={handleShareClick}
            className="w-12 h-12 rounded-full bg-surface/80 backdrop-blur-sm border border-gray-600 shadow-lg flex items-center justify-center text-xl hover:bg-surface/95 transition-all hover:scale-110 group"
            title="Share this passage"
            aria-label="Share this passage"
          >
            📤

            {/* Chromatic aberration effect on hover */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 via-blue-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg -z-10 animate-pulse" />
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          onClose();
        }}
        content={shareContent}
        position={position}
        onCreateQuoteCard={handleQuoteCardClick}
      />

      {/* Quote Card Modal */}
      <QuoteCardModal
        isOpen={isQuoteCardModalOpen}
        onClose={() => {
          setIsQuoteCardModalOpen(false);
          onClose();
        }}
        quote={cleanText(selectedText)}
        author={authorName}
        articleTitle={articleTitle}
        url={articleUrl}
      />
    </>
  );
}
