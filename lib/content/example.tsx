/**
 * Progressive Content Revelation - Integration Example
 *
 * This file demonstrates how to integrate the progressive content revelation
 * feature into an article page. Copy the relevant parts into your article component.
 *
 * // TODO: Remove this example file after integration is complete
 * // TODO: Add Storybook stories for DepthLayer components
 */

'use client';

import { useSessionProgress } from '@/lib/hooks/useSessionProgress';
import { DepthLayers, LockedLayerTeaser } from '@/components/content/DepthLayer';
import type { ContentLayer } from '@/types/content';

/**
 * Example: Define depth layers for an article
 *
 * In production, these would come from article metadata or database
 */
const EXAMPLE_DEPTH_LAYERS: ContentLayer[] = [
  {
    id: 'layer-counterarguments',
    articleId: 'article-1',
    thresholdMinutes: 5,
    title: 'Counterarguments',
    description: 'Alternative perspectives and limitations',
    content: `
      <h3>What Critics Say</h3>
      <p>Some researchers argue that progressive disclosure can be manipulative,
      as it creates artificial scarcity of information.</p>
      <h3>Limitations</h3>
      <p>This approach may not work well for time-sensitive content where readers
      need immediate access to all information.</p>
    `,
    unlocked: false,
  },
  {
    id: 'layer-behind-scenes',
    articleId: 'article-1',
    thresholdMinutes: 10,
    title: 'Behind the Scenes',
    description: 'Notes from the writing process',
    content: `
      <h3>Research Process</h3>
      <p>This article went through three major revisions based on feedback from
      early readers. The core argument remained stable, but examples evolved.</p>
      <h3>Acknowledgments</h3>
      <p>Special thanks to the beta readers who challenged my initial assumptions
      and helped refine these ideas.</p>
    `,
    unlocked: false,
  },
];

/**
 * Example: Article component with progressive content revelation
 *
 * This shows how to integrate the feature into your article page
 */
export function ExampleArticleWithProgressiveContent() {
  const articleId = 'article-1';

  // Use the session progress hook
  const {
    session,
    unlockedLayers,
    nextUnlockIn,
    timeOnPage,
    engagementLevel,
    newlyUnlockedMessages,
    clearMessages,
  } = useSessionProgress({
    articleId,
    depthLayers: EXAMPLE_DEPTH_LAYERS,
  });

  return (
    <article className="prose prose-invert max-w-none">
      {/* Base article content goes here */}
      <h1>Your Article Title</h1>
      <p>Your base article content...</p>

      {/* Engagement indicator */}
      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400">
          Time invested: <span className="font-bold text-primary">{timeOnPage}</span>
          {' · '}
          Engagement: <span className="font-bold">{engagementLevel}</span>
        </p>
      </div>

      {/* Newly unlocked content notifications */}
      {newlyUnlockedMessages.length > 0 && (
        <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded-lg">
          {newlyUnlockedMessages.map((message, index) => (
            <p key={index} className="text-sm text-green-300">
              {message}
            </p>
          ))}
          <button
            onClick={clearMessages}
            className="mt-2 text-xs text-gray-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unlocked bonus content */}
      <DepthLayers layers={unlockedLayers} />

      {/* Teaser for next locked layer */}
      {nextUnlockIn && nextUnlockIn > 0 && (
        <LockedLayerTeaser
          layer={{
            id: 'next-layer',
            articleId,
            thresholdMinutes: Math.ceil((Date.now() - session.startTime + nextUnlockIn) / 60000),
            title: 'More Insights',
            content: '',
            unlocked: false,
          }}
          timeUntilUnlock={nextUnlockIn}
        />
      )}
    </article>
  );
}

/**
 * Example: Server-side data fetching for depth layers
 *
 * This would go in your article page's server component or API route
 */
export async function getDepthLayersForArticle(
  articleId: string
): Promise<ContentLayer[]> {
  // In production, fetch from database or CMS
  // const db = getDb();
  // const layers = db.prepare('SELECT * FROM depth_layers WHERE articleId = ?').all(articleId);

  // For now, return example data
  return EXAMPLE_DEPTH_LAYERS.filter((layer) => layer.articleId === articleId);
}

/**
 * Example: Saving engagement data (server action)
 *
 * This would be called when the session ends or periodically
 */
export async function saveEngagementData(sessionId: string) {
  // Import server-side modules
  // const { saveSession } = await import('@/lib/engagement/tracking');
  // const session = await loadSessionFromStorage(sessionId);

  // await saveSession(session);
  console.log('Engagement data saved for session:', sessionId);
}

/**
 * Integration Checklist:
 *
 * ✅ 1. Add depth layer data to article metadata (database or frontmatter)
 * ✅ 2. Import useSessionProgress hook in article component
 * ✅ 3. Import DepthLayers and LockedLayerTeaser components
 * ✅ 4. Call useSessionProgress with articleId and depthLayers
 * ✅ 5. Render <DepthLayers layers={unlockedLayers} /> after base content
 * ✅ 6. Optionally render <LockedLayerTeaser /> for next upcoming layer
 * ✅ 7. Add engagement indicator (time on page, engagement level)
 * ✅ 8. Handle unlock notifications with clearMessages callback
 * ✅ 9. (Optional) Save session data to database via engagement tracking
 * ✅ 10. Test with different time thresholds (use DevTools to speed up time)
 *
 * Performance Considerations:
 * - Check interval is 5 seconds (balance between responsiveness and performance)
 * - localStorage persists session across page reloads
 * - No external dependencies required
 *
 * Accessibility Notes:
 * - All unlocked content uses semantic HTML (<section>)
 * - ARIA labels announce bonus content sections
 * - Unlock notifications should use aria-live regions in production
 * - Respect prefers-reduced-motion for animations (add CSS check)
 */
