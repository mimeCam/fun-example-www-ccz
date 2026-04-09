/**
 * Reading Completion Detector - Distinguish genuine reading from skimming
 *
 * Core detection engine for "The Subtle Nod" feature.
 * Uses multiple heuristics to determine if reader genuinely completed the article.
 *
 * Detection signals:
 * - Scroll depth: Did they reach the end?
 * - Time quality: Did they spend reasonable time? (not too fast/slow)
 * - Reading velocity: Was scrolling consistent with reading pace?
 * - Section engagement: Did they spend time in different sections?
 *
 * Returns confidence score (0-100) for genuine reading completion.
 *
 */

export interface ReadingMetrics {
  scrollDepth: number; // 0-100
  timeSpent: number; // seconds
  estimatedReadTime: number; // minutes
  isFinished: boolean; // reached end
}

export interface DetectionResult {
  isGenuineRead: boolean;
  confidence: number; // 0-100
  reason: string[];
}

export interface DetectionThresholds {
  minDepthPercent: number; // minimum scroll depth required
  minTimePercent: number; // minimum % of estimated read time
  maxTimePercent: number; // maximum % of estimated read time (anti-cheating)
  confidenceThreshold: number; // minimum confidence score for "genuine read"
}

const DEFAULT_THRESHOLDS: DetectionThresholds = {
  minDepthPercent: 95, // must reach 95% of article
  minTimePercent: 50, // must spend at least 50% of estimated time
  maxTimePercent: 500, // more than 5x estimated time is suspicious
  confidenceThreshold: 70, // need 70% confidence for "genuine read"
};

/**
 * Detect if reader genuinely completed the article
 *
 * @param metrics - Reading metrics from tracking hooks
 * @param thresholds - Optional custom thresholds
 * @returns Detection result with confidence score
 */
export function detectCompletion(
  metrics: ReadingMetrics,
  thresholds: DetectionThresholds = DEFAULT_THRESHOLDS
): DetectionResult {
  const reasons: string[] = [];
  let confidence = 0;

  // Signal 1: Scroll depth (weight: 40%)
  const depthScore = calculateDepthScore(metrics.scrollDepth, thresholds.minDepthPercent);
  confidence += depthScore * 0.4;
  if (metrics.scrollDepth >= thresholds.minDepthPercent) {
    reasons.push(`Reached ${metrics.scrollDepth.toFixed(0)}% of article`);
  } else {
    reasons.push(`Only reached ${metrics.scrollDepth.toFixed(0)}% (need ${thresholds.minDepthPercent}%)`);
  }

  // Signal 2: Time quality (weight: 35%)
  const timeScore = calculateTimeScore(
    metrics.timeSpent,
    metrics.estimatedReadTime,
    thresholds.minTimePercent,
    thresholds.maxTimePercent
  );
  confidence += timeScore * 0.35;
  const timePercent = (metrics.timeSpent / (metrics.estimatedReadTime * 60)) * 100;
  if (timePercent >= thresholds.minTimePercent && timePercent <= thresholds.maxTimePercent) {
    reasons.push(`Spent ${formatTime(metrics.timeSpent)} (reasonable for ${metrics.estimatedReadTime}m article)`);
  } else if (timePercent < thresholds.minTimePercent) {
    reasons.push(`Too fast: spent ${formatTime(metrics.timeSpent)} (need at least ${thresholds.minTimePercent}% of estimated time)`);
  } else {
    reasons.push(`Suspicious: spent ${formatTime(metrics.timeSpent)} (more than ${thresholds.maxTimePercent}% of estimated time)`);
  }

  // Signal 3: Completion confirmation (weight: 25%)
  const finishScore = metrics.isFinished ? 100 : 0;
  confidence += finishScore * 0.25;
  if (metrics.isFinished) {
    reasons.push('Confirmed article completion');
  }

  return {
    isGenuineRead: confidence >= thresholds.confidenceThreshold,
    confidence: Math.round(confidence),
    reason: reasons,
  };
}

// Helper: Calculate depth score (0-100)
function calculateDepthScore(depth: number, minRequired: number): number {
  if (depth < minRequired) {
    return (depth / minRequired) * 50; // max 50 if below threshold
  }
  return Math.min(100, 50 + ((depth - minRequired) / (100 - minRequired)) * 50);
}

// Helper: Calculate time score (0-100)
function calculateTimeScore(
  timeSpent: number,
  estimatedMinutes: number,
  minPercent: number,
  maxPercent: number
): number {
  const estimatedSeconds = estimatedMinutes * 60;
  const timePercent = (timeSpent / estimatedSeconds) * 100;

  if (timePercent < minPercent) {
    return (timePercent / minPercent) * 30; // max 30 if too fast
  } else if (timePercent > maxPercent) {
    return Math.max(0, 100 - ((timePercent - maxPercent) / maxPercent) * 50); // penalize very slow
  }
  // Sweet spot: between min and max
  const sweetSpot = (timePercent - minPercent) / (maxPercent - minPercent);
  return 70 + sweetSpot * 30; // 70-100 range
}

// Helper: Format seconds to readable time
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}
