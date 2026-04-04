/**
 * Platform Formatters
 * Creates optimized share formats for different platforms.
 *
 * Each platform has unique characteristics:
 * - Twitter: 280 char limit, hashtags, mentions
 * - LinkedIn: Professional tone, longer form allowed
 * - Email: Full context, personalized greeting
 * - Facebook: Casual, visual
 * - Mastodon: 500 char limit, content warnings
 * - Bluesky: Similar to Twitter but 300 char limit
 */

export interface ShareContent {
  text: string;
  articleTitle: string;
  articleUrl: string;
  authorName: string;
  authorHandle?: string;
  tags?: string[];
}

export interface FormattedShare {
  content: string;
  platform: SharePlatform;
  characterCount: number;
  url?: string;
}

export type SharePlatform =
  | 'twitter'
  | 'linkedin'
  | 'email'
  | 'facebook'
  | 'mastodon'
  | 'bluesky'
  | 'clipboard';

/**
 * Platform character limits and configurations.
 */
const PLATFORM_CONFIGS: Record<SharePlatform, { maxLength: number; name: string }> = {
  twitter: { maxLength: 280, name: 'Twitter' },
  linkedin: { maxLength: 3000, name: 'LinkedIn' },
  email: { maxLength: Infinity, name: 'Email' },
  facebook: { maxLength: 63206, name: 'Facebook' },
  mastodon: { maxLength: 500, name: 'Mastodon' },
  bluesky: { maxLength: 300, name: 'Bluesky' },
  clipboard: { maxLength: Infinity, name: 'Clipboard' },
};

/**
 * Format content for Twitter/X.
 * Optimized for engagement with hashtags and mentions.
 */
export function formatForTwitter(content: ShareContent): FormattedShare {
  const maxLength = PLATFORM_CONFIGS.twitter.maxLength;
  const hashtags = content.tags || ['reading', 'insight'];

  // Build quote with attribution
  const quote = `"${content.text}"`;
  const attribution = `— ${content.authorName}`;
  const articleRef = `📖 ${content.articleTitle}`;

  // Calculate available space for hashtags
  const baseLength = quote.length + attribution.length + articleRef.length + 10; // +10 for spacing
  const availableSpace = maxLength - baseLength - content.articleUrl.length - 15;

  // Add hashtags if space permits
  let hashtagString = '';
  if (availableSpace > 20) {
    const tagString = hashtags.map(tag => `#${tag}`).join(' ');
    if (tagString.length <= availableSpace) {
      hashtagString = `\n\n${tagString}`;
    }
  }

  // Assemble tweet
  const tweet = `${quote}\n\n${attribution}\n${articleRef}${hashtagString}\n\n${content.articleUrl}`;

  return {
    content: tweet,
    platform: 'twitter',
    characterCount: tweet.length,
    url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(content.articleUrl)}`,
  };
}

/**
 * Format content for LinkedIn.
 * Professional tone with more context.
 */
export function formatForLinkedIn(content: ShareContent): FormattedShare {
  const maxLength = PLATFORM_CONFIGS.linkedin.maxLength;

  // Build professional post
  const lines = [
    `"${content.text}"`,
    '',
    `I found this insightful in ${content.articleTitle} by ${content.authorName}.`,
    '',
    `What are your thoughts?`,
    '',
    content.articleUrl,
    '',
    `#ProfessionalDevelopment #Learning #Insight`,
  ];

  const post = lines.join('\n');

  return {
    content: post,
    platform: 'linkedin',
    characterCount: post.length,
    url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.articleUrl)}`,
  };
}

/**
 * Format content for Email.
 * Full context with personalized greeting.
 */
export function formatForEmail(content: ShareContent): FormattedShare {
  const subject = `Thought you'd enjoy: ${content.articleTitle}`;

  const body = `Hi,

I came across this insightful passage and thought of you:

"${content.text}"

— ${content.authorName}, from "${content.articleTitle}"

Read the full article here:
${content.articleUrl}

Hope you find it as valuable as I did!

Best`;

  return {
    content: body,
    platform: 'email',
    characterCount: body.length,
    url: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}

/**
 * Format content for Facebook.
 * Casual, visual-friendly format.
 */
export function formatForFacebook(content: ShareContent): FormattedShare {
  const lines = [
    `"${content.text}"`,
    '',
    `— ${content.authorName}`,
    '',
    `Great read from "${content.articleTitle}"`,
  ];

  const post = lines.join('\n');

  return {
    content: post,
    platform: 'facebook',
    characterCount: post.length,
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.articleUrl)}&quote=${encodeURIComponent(content.text)}`,
  };
}

/**
 * Format content for Mastodon.
 * Supports content warnings and longer posts.
 */
export function formatForMastodon(content: ShareContent): FormattedShare {
  const maxLength = PLATFORM_CONFIGS.mastodon.maxLength;

  const lines = [
    `"${content.text}"`,
    '',
    `— ${content.authorName}`,
    '',
    `From: ${content.articleTitle}`,
    '',
    content.articleUrl,
    '',
    `#Reading #Insight`,
  ];

  const post = lines.join('\n');

  return {
    content: post,
    platform: 'mastodon',
    characterCount: post.length,
    url: undefined, // Mastodon requires instance URL, handled in share execution
  };
}

/**
 * Format content for Bluesky.
 * Similar to Twitter but 300 char limit.
 */
export function formatForBluesky(content: ShareContent): FormattedShare {
  const maxLength = PLATFORM_CONFIGS.bluesky.maxLength;

  const quote = `"${content.text}"`;
  const attribution = `— ${content.authorName}`;
  const url = content.articleUrl;

  const post = `${quote}\n\n${attribution}\n\n${url}`;

  return {
    content: post,
    platform: 'bluesky',
    characterCount: post.length,
    url: `https://bsky.app/intent/compose?text=${encodeURIComponent(post)}`,
  };
}

/**
 * Format for clipboard (generic).
 * Works anywhere, markdown-style formatting.
 */
export function formatForClipboard(content: ShareContent): FormattedShare {
  const lines = [
    `> ${content.text}`,
    '',
    `— ${content.authorName}, *${content.articleTitle}*`,
    '',
    content.articleUrl,
  ];

  const text = lines.join('\n');

  return {
    content: text,
    platform: 'clipboard',
    characterCount: text.length,
  };
}

/**
 * Format content for a specific platform.
 * Main entry point for platform-specific formatting.
 */
export function formatForPlatform(
  platform: SharePlatform,
  content: ShareContent
): FormattedShare {
  switch (platform) {
    case 'twitter':
      return formatForTwitter(content);
    case 'linkedin':
      return formatForLinkedIn(content);
    case 'email':
      return formatForEmail(content);
    case 'facebook':
      return formatForFacebook(content);
    case 'mastodon':
      return formatForMastodon(content);
    case 'bluesky':
      return formatForBluesky(content);
    case 'clipboard':
      return formatForClipboard(content);
    default:
      return formatForClipboard(content);
  }
}

/**
 * Get all available platforms.
 */
export function getAvailablePlatforms(): SharePlatform[] {
  return Object.keys(PLATFORM_CONFIGS) as SharePlatform[];
}

/**
 * Get platform config by name.
 */
export function getPlatformConfig(platform: SharePlatform): { maxLength: number; name: string } {
  return PLATFORM_CONFIGS[platform] || { maxLength: Infinity, name: 'Unknown' };
}
