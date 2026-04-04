/**
 * Scroll Utilities - Smooth scroll and position helpers
 *
 * Performance-first approach:
 * - Uses requestAnimationFrame for smooth animations
 * - Respects user's prefers-reduced-motion preference
 * - Handles edge cases (short pages, out of bounds)
 *
 * Based on Michael Koch's architectural recommendation:
 * "requestAnimationFrame for smooth progress updates"
 */

/**
 * Smoothly scroll to a specific Y position
 *
 * @param scrollY - Target scroll position in pixels
 * @param duration - Animation duration in milliseconds (default: 500ms)
 */
export function scrollToPosition(
  scrollY: number,
  duration: number = 500
): void {
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Instant scroll for users who prefer reduced motion
    window.scrollTo({
      top: scrollY,
      behavior: 'instant',
    });
    return;
  }

  const startPosition = window.scrollY;
  const distance = scrollY - startPosition;

  // Don't animate if distance is too small (< 10px)
  if (Math.abs(distance) < 10) {
    window.scrollTo({
      top: scrollY,
      behavior: 'instant',
    });
    return;
  }

  let startTime: number | null = null;

  function animateScroll(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;

    // Ease-out cubic function for smooth deceleration
    const progress = Math.min(timeElapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);

    const newPosition = startPosition + distance * easeOut;

    window.scrollTo({
      top: newPosition,
      behavior: 'instant',
    });

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  }

  requestAnimationFrame(animateScroll);
}

/**
 * Calculate scroll position percentage
 *
 * @param scrollY - Current scroll position
 * @param documentHeight - Total document height
 * @param viewportHeight - Viewport height
 * @returns Scroll percentage (0-100)
 */
export function calculateScrollPercent(
  scrollY: number,
  documentHeight: number,
  viewportHeight: number
): number {
  const scrollableDistance = documentHeight - viewportHeight;

  if (scrollableDistance <= 0) return 100;

  const rawProgress = (scrollY / scrollableDistance) * 100;
  return Math.min(100, Math.max(0, rawProgress));
}

/**
 * Check if element is in viewport
 *
 * @param element - DOM element to check
 * @param threshold - Visibility threshold (0-1, default: 0.5)
 * @returns True if element is visible
 */
export function isElementInViewport(
  element: HTMLElement,
  threshold: number = 0.5
): boolean {
  if (typeof window === 'undefined') return false;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  const visibleHeight = Math.min(
    rect.bottom,
    windowHeight
  ) - Math.max(rect.top, 0);

  const elementVisiblePercent = visibleHeight / rect.height;

  return elementVisiblePercent >= threshold;
}
