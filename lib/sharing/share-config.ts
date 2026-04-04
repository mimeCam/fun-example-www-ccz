/**
 * Share Configuration
 * Central configuration for sharing behavior and platform templates.
 */

import { SharePlatform } from './platform-formatters';

/**
 * Default hashtags to include in shares.
 */
export const DEFAULT_HASHTAGS = ['reading', 'insight', 'learning'];

/**
 * Platform-specific display names.
 */
export const PLATFORM_NAMES: Record<SharePlatform, string> = {
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  email: 'Email',
  facebook: 'Facebook',
  mastodon: 'Mastodon',
  bluesky: 'Bluesky',
  clipboard: 'Copy to Clipboard',
};

/**
 * Platform icons for UI display.
 */
export const PLATFORM_ICONS: Record<SharePlatform, string> = {
  twitter: '🐦',
  linkedin: '💼',
  email: '✉️',
  facebook: '👤',
  mastodon: '🦣',
  bluesky: '🦋',
  clipboard: '📋',
};

/**
 * Platform colors for UI theming.
 */
export const PLATFORM_COLORS: Record<SharePlatform, string> = {
  twitter: 'bg-blue-500',
  linkedin: 'bg-blue-700',
  email: 'bg-gray-600',
  facebook: 'bg-blue-600',
  mastodon: 'bg-purple-600',
  bluesky: 'bg-sky-500',
  clipboard: 'bg-gray-700',
};

/**
 * Character limits per platform.
 */
export const PLATFORM_LIMITS: Record<SharePlatform, number> = {
  twitter: 280,
  linkedin: 3000,
  email: Infinity,
  facebook: 63206,
  mastodon: 500,
  bluesky: 300,
  clipboard: Infinity,
};

/**
 * Share behavior configuration.
 */
export const SHARE_CONFIG = {
  /**
   * Minimum scroll depth before showing FAB (percentage).
   */
  fabShowAtScrollDepth: 20,

  /**
   * Minimum text selection length for share button (characters).
   */
  minSelectionLength: 10,

  /**
   * Maximum text selection length for share button (characters).
   */
  maxSelectionLength: 500,

  /**
   * Auto-dismiss share button after milliseconds.
   */
  autoDismissDelay: 3000,

  /**
   * Enable native Web Share API on supported devices.
   */
  preferNativeShare: true,

  /**
   * Show character count in share modal.
   */
  showCharacterCount: true,

  /**
   * Default platforms to show in modal (order matters).
   */
  defaultPlatforms: [
    'twitter',
    'linkedin',
    'email',
    'facebook',
    'mastodon',
    'bluesky',
    'clipboard',
  ] as SharePlatform[],

  /**
   * Maximum number of auto-extracted quotes.
   */
  maxAutoExtractedQuotes: 5,

  /**
   * Minimum quote length for auto-extraction.
   */
  minQuoteLength: 50,

  /**
   * Maximum quote length for auto-extraction.
   */
  maxQuoteLength: 300,
} as const;

/**
 * Article metadata defaults.
 */
export const ARTICLE_METADATA = {
  /**
   * Default author name when not specified.
   */
  defaultAuthor: 'Author Name',

  /**
   * Default site name for attribution.
   */
  defaultSiteName: 'Persona Blog',

  /**
   * Default tags to include.
   */
  defaultTags: DEFAULT_HASHTAGS,
} as const;

/**
 * Get platform display name.
 */
export function getPlatformName(platform: SharePlatform): string {
  return PLATFORM_NAMES[platform] || 'Unknown';
}

/**
 * Get platform icon.
 */
export function getPlatformIcon(platform: SharePlatform): string {
  return PLATFORM_ICONS[platform] || '📤';
}

/**
 * Get platform color class.
 */
export function getPlatformColor(platform: SharePlatform): string {
  return PLATFORM_COLORS[platform] || 'bg-gray-600';
}

/**
 * Get platform character limit.
 */
export function getPlatformLimit(platform: SharePlatform): number {
  return PLATFORM_LIMITS[platform] || Infinity;
}

/**
 * Check if platform supports native sharing.
 */
export function isNativePlatform(platform: SharePlatform): boolean {
  return platform !== 'email' && platform !== 'clipboard';
}
