'use client';

import { useEffect, useRef, useState } from 'react';
import { cleanText } from '@/lib/sharing/text-utils';
import { copyWithFeedback } from '@/lib/sharing/clipboard-utils';

interface ShareButtonProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  articleTitle: string;
  articleUrl: string;
  authorName?: string;
  onClose: () => void;
}

/**
 * Simplified share button - single floating icon.
 * Appears on text selection, generates shareable card on click.
 * Auto-dismisses after 3s or on scroll (per UIX principles).
 */
export function ShareButton({
  isVisible,
  position,
  selectedText,
  articleTitle,
  articleUrl,
  authorName = 'Author Name',
  onClose,
}: ShareButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [showCard, setShowCard] = useState(false);
  const autoDismissRef = useRef<NodeJS.Timeout>();

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (!isVisible) {
      clearTimeout(autoDismissRef.current);
      return;
    }

    autoDismissRef.current = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(autoDismissRef.current);
  }, [isVisible, onClose]);

  // Dismiss on scroll
  useEffect(() => {
    if (!isVisible) return;

    const handleScroll = () => onClose();

    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll, true);
  }, [isVisible, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  // Generate and copy shareable card
  const handleShare = async () => {
    const cleanedText = cleanText(selectedText);

    // Generate shareable card format
    const card = generateShareCard({
      text: cleanedText,
      articleTitle,
      authorName,
      articleUrl,
    });

    await copyWithFeedback(card, 'Shareable card copied!');
    setShowCard(true);
    setTimeout(() => onClose(), 500);
  };

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
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-surface/80 backdrop-blur-sm border border-gray-600 shadow-lg flex items-center justify-center text-xl hover:bg-surface/95 transition-all hover:scale-110"
            title="Share this passage"
          >
            📤
          </button>

          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg -z-10 animate-pulse" />
        </div>
      </div>

      {/* Preview card (optional feedback) */}
      {showCard && (
        <div className="fixed top-4 right-4 z-50 bg-surface/90 backdrop-blur-sm border border-gray-600 rounded-lg shadow-xl p-4 max-w-sm animate-fadeIn">
          <div className="text-sm text-gray-300 mb-2">Shareable card copied!</div>
          <div className="text-xs text-gray-500">Paste anywhere to share</div>
        </div>
      )}
    </>
  );
}

/**
 * Generate shareable card format.
 * Creates a beautiful text-based card that can be pasted anywhere.
 *
 * TODO: Enhance to generate image card (HTML canvas)
 * TODO: Add custom branding options
 * TODO: Add QR code for mobile sharing
 */
function generateShareCard(data: {
  text: string;
  articleTitle: string;
  authorName: string;
  articleUrl: string;
}): string {
  const maxLength = 280; // Twitter limit for compatibility

  // Truncate text if too long
  let text = data.text;
  const metadataLength = data.articleTitle.length + data.authorName.length + data.articleUrl.length + 20;

  if (text.length + metadataLength > maxLength) {
    text = text.substring(0, maxLength - metadataLength - 3) + '...';
  }

  // Build card with visual hierarchy
  const lines = [
    `"${text}"`,
    '',
    `📖 ${data.articleTitle}`,
    `✍️ ${data.authorName}`,
    '',
    `[Continue reading →](${data.articleUrl})`,
  ];

  return lines.join('\n');
}
