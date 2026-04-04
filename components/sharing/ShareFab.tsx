'use client';

import { useState, useEffect } from 'react';
import { ShareModal } from './ShareModal';
import { ShareContent } from '@/lib/sharing/platform-formatters';

interface ShareFabProps {
  articleTitle: string;
  articleUrl: string;
  authorName: string;
  selectedText?: string;
  tags?: string[];
  showAtScrollDepth?: number; // Percentage (0-100)
}

/**
 * Floating Action Button (FAB) for sharing.
 * Appears at specified scroll depth, persists in bottom-right corner.
 *
 * Per UX spec:
 * - Appears at 20% scroll (configurable)
 * - Fixed position (bottom-right)
 * - Chromatic aberration accent on hover
 * - 48px minimum target (accessibility)
 */
export function ShareFab({
  articleTitle,
  articleUrl,
  authorName,
  selectedText,
  tags,
  showAtScrollDepth = 20,
}: ShareFabProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollDepth = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollDepth >= showAtScrollDepth);
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAtScrollDepth]);

  // Don't render if not visible
  if (!isVisible) return null;

  // Prepare share content
  const shareContent: ShareContent = {
    text: selectedText || `Great read from ${articleTitle}`,
    articleTitle,
    articleUrl,
    authorName,
    tags,
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="
          fixed bottom-8 right-8 z-40
          w-14 h-14 rounded-full
          bg-primary/90 backdrop-blur-sm
          border-2 border-white/20
          shadow-xl hover:shadow-2xl
          text-white text-2xl
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110 hover:bg-primary
          animate-bounce-in
          group
        "
        title="Share this article"
        aria-label="Share this article"
      >
        📤

        {/* Chromatic aberration effect on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/30 via-blue-500/30 to-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg group-hover:blur-xl transition-all" />
      </button>

      {/* Share Modal */}
      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={shareContent}
      />
    </>
  );
}

/**
 * Compact Share Fab
 * Smaller version for mobile or minimal UI.
 */
export function ShareFabCompact({
  articleTitle,
  articleUrl,
  authorName,
  selectedText,
  tags,
  showAtScrollDepth = 20,
}: ShareFabProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollDepth = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollDepth >= showAtScrollDepth);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAtScrollDepth]);

  if (!isVisible) return null;

  const shareContent: ShareContent = {
    text: selectedText || `Great read from ${articleTitle}`,
    articleTitle,
    articleUrl,
    authorName,
    tags,
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="
          fixed bottom-6 right-6 z-40
          w-10 h-10 rounded-full
          bg-primary/80 backdrop-blur-sm
          border border-white/20
          shadow-lg
          text-white text-lg
          flex items-center justify-center
          hover:scale-110 transition-transform
        "
        title="Share"
        aria-label="Share"
      >
        📤
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={shareContent}
      />
    </>
  );
}
