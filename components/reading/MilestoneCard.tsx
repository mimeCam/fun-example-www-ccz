'use client';

import { useState, useEffect } from 'react';

/**
 * MilestoneCard - Shareable milestone celebration cards
 *
 * Design principles:
 * - Celebrate reading achievements with style
 * - Strong elevation (12px shadow) for shareable content
 * - Gold/amber milestone colors
 * - Rounded corners (16px for approachable feel)
 * - Social sharing built-in
 * - Persistent tracking across sessions
 *
 * Based on Tanya Donskaia's UIX spec:
 * - "🎉 Milestone Reached! Analysis Complete"
 * - Share button for social media
 * - Download as image feature
 * - Chromatic aberration effect on entry
 * - Translucent backdrop with blur
 *
 * // TODO: Add confetti burst animation
 * // TODO: Add social proof count ("47 readers finished this")
 * // TODO: Add milestone-specific imagery/icons
 * // TODO: Add user achievement badge
 */

interface MilestoneCardProps {
  milestone: 50 | 100;
  articleTitle: string;
  timeToComplete: number; // in minutes
  isVisible: boolean;
  onDismiss: () => void;
}

export function MilestoneCard({
  milestone,
  articleTitle,
  timeToComplete,
  isVisible,
  onDismiss,
}: MilestoneCardProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      // Allow exit animation
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  const milestoneData = milestone === 50
    ? {
        icon: '🎯',
        title: 'Halfway There!',
        message: "You're making great progress. Keep going!",
      }
    : {
        icon: '🎉',
        title: 'Milestone Reached!',
        message: `You completed "${articleTitle}" in ${timeToComplete} minutes!`,
      };

  const handleShare = async (platform: string) => {
    const shareText = milestone === 50
      ? `🎯 I'm 50% through "${articleTitle}"! Loving it so far.`
      : `🎉 Just finished "${articleTitle}"! Great read (${timeToComplete} min).`;

    const shareUrl = window.location.href;

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        break;
      case 'copy':
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        // TODO: Show toast notification
        break;
    }
    setShowShareMenu(false);
  };

  // TODO: Implement download as image
  const handleDownload = () => {
    // Placeholder for download functionality
    console.log('Download milestone card as image');
    setShowShareMenu(false);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/30 max-w-md w-full overflow-hidden transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header with icon */}
        <div className="bg-gradient-to-r from-amber-500/20 to-yellow-400/20 px-6 py-8 text-center">
          <span className="text-6xl" role="img" aria-label="milestone icon">
            {milestoneData.icon}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-gray-100">
            {milestoneData.title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-300 text-center mb-6">{milestoneData.message}</p>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold rounded-xl transition-colors"
            >
              <span>📤</span>
              Share Achievement
            </button>

            {showShareMenu && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button
                  onClick={() => handleShare('twitter')}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                >
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                >
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            )}

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-xl transition-colors"
            >
              <span>💾</span>
              Save as Image
            </button>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <span className="text-lg">✕</span>
        </button>
      </div>
    </div>
  );
}

// TODO: Add confetti burst animation component
// TODO: Add milestone streak indicator ("3rd milestone this week!")
// TODO: Add personalized quote based on reading topic
