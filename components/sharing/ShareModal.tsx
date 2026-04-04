'use client';

import { useState } from 'react';
import { executeShare, ShareResult } from '@/lib/sharing/share-execution';
import { ShareContent, SharePlatform } from '@/lib/sharing/platform-formatters';
import { copyWithFeedback } from '@/lib/sharing/clipboard-utils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ShareContent;
  position?: { x: number; y: number };
}

/**
 * Platform definitions with icons and colors.
 */
const PLATFORMS = [
  {
    id: 'twitter' as SharePlatform,
    name: 'Twitter',
    icon: '🐦',
    color: 'bg-blue-500',
  },
  {
    id: 'linkedin' as SharePlatform,
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700',
  },
  {
    id: 'email' as SharePlatform,
    name: 'Email',
    icon: '✉️',
    color: 'bg-gray-600',
  },
  {
    id: 'facebook' as SharePlatform,
    name: 'Facebook',
    icon: '👤',
    color: 'bg-blue-600',
  },
  {
    id: 'mastodon' as SharePlatform,
    name: 'Mastodon',
    icon: '🦣',
    color: 'bg-purple-600',
  },
  {
    id: 'bluesky' as SharePlatform,
    name: 'Bluesky',
    icon: '🦋',
    color: 'bg-sky-500',
  },
  {
    id: 'clipboard' as SharePlatform,
    name: 'Copy',
    icon: '📋',
    color: 'bg-gray-700',
  },
];

/**
 * Share Modal Component
 * Beautiful platform selection interface.
 *
 * Features:
 * - Translucent overlay (Pro feel)
 * - Platform grid with icons
 * - Character count preview
 * - Chromatic aberration accent on hover
 */
export function ShareModal({ isOpen, onClose, content, position }: ShareModalProps) {
  const [sharingPlatform, setSharingPlatform] = useState<SharePlatform | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (!isOpen) return null;

  // Handle platform selection
  const handleShare = async (platform: SharePlatform) => {
    setSharingPlatform(platform);

    const result: ShareResult = await executeShare(platform, content, {
      preferNative: true,
      onNativeFallback: () => {
        // Optional: Show toast about fallback
      },
    });

    if (result.success) {
      if (platform === 'clipboard' || result.method === 'clipboard') {
        copyWithFeedback('Copied to clipboard!');
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          onClose();
        }, 1500);
      } else {
        // For URL-based shares, close modal immediately
        onClose();
      }
    } else {
      // Show error feedback
      console.error('Share failed:', result.error);
      setSharingPlatform(null);
    }
  };

  // Calculate position (center if not specified, otherwise near click)
  const modalStyle = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }
    : {};

  return (
    <>
      {/* Translucent backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 bg-surface/95 backdrop-blur-md border border-gray-600 rounded-xl shadow-2xl p-6 min-w-[320px] max-w-md animate-scaleIn"
        style={modalStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Share this quote</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Close share modal"
          >
            ✕
          </button>
        </div>

        {/* Quote preview */}
        <div className="bg-surface/80 rounded-lg p-4 mb-4 border border-gray-700">
          <p className="text-sm text-gray-300 italic mb-2">
            &ldquo;{content.text.substring(0, 150)}
            {content.text.length > 150 ? '...' : ''}&rdquo;
          </p>
          <p className="text-xs text-gray-500">
            — {content.authorName}, {content.articleTitle}
          </p>
        </div>

        {/* Platform grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleShare(platform.id)}
              disabled={sharingPlatform !== null}
              className={`
                flex flex-col items-center gap-2 p-3 rounded-lg
                border border-gray-600 transition-all
                hover:scale-105 hover:shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                group relative overflow-hidden
                ${sharingPlatform === platform.id ? 'ring-2 ring-primary' : ''}
              `}
            >
              {/* Chromatic aberration effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Platform icon */}
              <span className="text-2xl relative z-10">{platform.icon}</span>

              {/* Platform name */}
              <span className="text-xs text-gray-300 relative z-10">{platform.name}</span>
            </button>
          ))}
        </div>

        {/* Footer with character count */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{content.text.length} characters</span>
          {sharingPlatform && (
            <span className="text-primary animate-pulse">Sharing...</span>
          )}
        </div>

        {/* Success feedback overlay */}
        {showFeedback && (
          <div className="absolute inset-0 bg-green-600/90 backdrop-blur-sm rounded-xl flex items-center justify-center animate-fadeIn">
            <div className="text-center">
              <div className="text-4xl mb-2">✓</div>
              <div className="text-white font-medium">Copied to clipboard!</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Simplified Share Modal
 * Minimal version for quick access.
 */
export function ShareModalSimple({ isOpen, onClose, content }: ShareModalProps) {
  const handleShare = async (platform: SharePlatform) => {
    await executeShare(platform, content);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-surface/95 backdrop-blur-md border border-gray-600 rounded-xl shadow-2xl p-6 animate-scaleIn">
        <p className="text-white mb-4">Share this quote</p>
        <div className="grid grid-cols-4 gap-2">
          {PLATFORMS.slice(0, 4).map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleShare(platform.id)}
              className="p-3 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
            >
              {platform.icon}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
