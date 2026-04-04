/**
 * Share Execution Engine
 * Handles the actual sharing logic using Web Share API and fallbacks.
 *
 * Priority order:
 * 1. Native Web Share API (mobile, best UX)
 * 2. Platform-specific URLs (twitter.com, etc.)
 * 3. Clipboard fallback (desktop, manual sharing)
 */

import { copyToClipboard, copyWithFeedback } from './clipboard-utils';
import { FormattedShare, ShareContent, SharePlatform, formatForPlatform } from './platform-formatters';

export interface ShareResult {
  success: boolean;
  platform: SharePlatform;
  method: 'native' | 'url' | 'clipboard';
  error?: string;
}

/**
 * Check if Web Share API is supported.
 */
export function isWebShareSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    typeof navigator.share === 'function'
  );
}

/**
 * Share using native Web Share API.
 * Best experience on mobile devices.
 */
async function shareNative(
  title: string,
  text: string,
  url: string
): Promise<ShareResult> {
  try {
    await navigator.share({
      title,
      text,
      url,
    });

    return {
      success: true,
      platform: 'clipboard', // Native doesn't specify platform
      method: 'native',
    };
  } catch (error) {
    // User cancelled the share
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        platform: 'clipboard',
        method: 'native',
        error: 'Share cancelled by user',
      };
    }

    // Other errors
    return {
      success: false,
      platform: 'clipboard',
      method: 'native',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Share using platform-specific URL.
 * Opens platform in new tab/window.
 */
function shareByUrl(url: string, platform: SharePlatform): ShareResult {
  try {
    // Open in new window
    const width = 600;
    const height = 400;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      url,
      'share',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    return {
      success: true,
      platform,
      method: 'url',
    };
  } catch (error) {
    return {
      success: false,
      platform,
      method: 'url',
      error: error instanceof Error ? error.message : 'Failed to open share window',
    };
  }
}

/**
 * Share using clipboard (fallback).
 * Copies formatted content to clipboard.
 */
async function shareClipboard(formatted: FormattedShare): Promise<ShareResult> {
  const success = await copyToClipboard(formatted.content);

  return {
    success,
    platform: formatted.platform,
    method: 'clipboard',
    error: success ? undefined : 'Failed to copy to clipboard',
  };
}

/**
 * Execute share with intelligent platform detection.
 * Tries native share first, then platform-specific, then clipboard.
 */
export async function executeShare(
  platform: SharePlatform,
  content: ShareContent,
  options: {
    preferNative?: boolean;
    onNativeFallback?: () => void;
  } = {}
): Promise<ShareResult> {
  const { preferNative = true, onNativeFallback } = options;

  // Format content for the platform
  const formatted = formatForPlatform(platform, content);

  // Try native Web Share API first (if supported and requested)
  if (preferNative && isWebShareSupported() && platform !== 'email' && platform !== 'clipboard') {
    const nativeResult = await shareNative(
      content.articleTitle,
      formatted.content,
      content.articleUrl
    );

    if (nativeResult.success) {
      return nativeResult;
    }

    // Native failed or was cancelled, fall back to platform-specific
    if (onNativeFallback) {
      onNativeFallback();
    }
  }

  // Email always uses mailto: link
  if (platform === 'email') {
    if (formatted.url) {
      return shareByUrl(formatted.url, platform);
    }
  }

  // Try platform-specific URL
  if (formatted.url) {
    return shareByUrl(formatted.url, platform);
  }

  // Final fallback: clipboard
  return await shareClipboard(formatted);
}

/**
 * Share with automatic platform selection.
 * Useful for "quick share" buttons.
 */
export async function quickShare(
  content: ShareContent,
  preferredPlatform?: SharePlatform
): Promise<ShareResult> {
  // If native share is available, use it (best UX)
  if (isWebShareSupported() && !preferredPlatform) {
    return await shareNative(
      content.articleTitle,
      content.text,
      content.articleUrl
    );
  }

  // Otherwise use preferred platform or default to clipboard
  const platform = preferredPlatform || 'clipboard';
  return await executeShare(platform, content, { preferNative: false });
}

/**
 * Share multiple platforms (for testing/analytics).
 * Executes shares in sequence.
 */
export async function shareMultiple(
  platforms: SharePlatform[],
  content: ShareContent
): Promise<ShareResult[]> {
  const results: ShareResult[] = [];

  for (const platform of platforms) {
    const result = await executeShare(platform, content, { preferNative: false });
    results.push(result);

    // Small delay between shares to avoid browser blocking
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Get available share methods.
 * Useful for UI to show/hide options.
 */
export function getAvailableShareMethods(): {
  native: boolean;
  url: boolean;
  clipboard: boolean;
} {
  return {
    native: isWebShareSupported(),
    url: typeof window !== 'undefined' && typeof window.open === 'function',
    clipboard: typeof navigator !== 'undefined' &&
      (('clipboard' in navigator && typeof navigator.clipboard?.writeText === 'function') ||
        typeof document?.execCommand === 'function'),
  };
}
