'use client';

import { useState, useEffect } from 'react';
import { getTTSPlayer, TTSState, TTSPlaybackProgress } from '@/lib/audio/tts-player';

interface JourneyPlayerProps {
  journeyId: string;
  articles: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  currentArticleIndex: number;
}

/**
 * Journey Player Component
 *
 * A focused, distraction-free audio + reading experience.
 *
 * Design Philosophy (from Tanya):
 * - Primary color for progress bar and active state
 * - Subtle translucency on controls
 * - Minimal controls (play, skip, speed, mode toggle)
 * - Journey context badge
 * - Auto-advance to next article
 * - ONE primary action per screen
 */
export function JourneyPlayer({
  journeyId,
  articles,
  currentArticleIndex: initialIndex = 0,
}: JourneyPlayerProps) {
  const [currentArticleIndex, setCurrentArticleIndex] = useState(initialIndex);
  const [mode, setMode] = useState<'audio' | 'read'>('audio');
  const [playbackState, setPlaybackState] = useState<TTSState>('idle');
  const [progress, setProgress] = useState<TTSPlaybackProgress>({
    currentText: '',
    currentIndex: 0,
    totalSegments: 0,
    isPlaying: false,
  });
  const [speed, setSpeed] = useState(1.0);

  const player = getTTSPlayer({
    onStateChange: setPlaybackState,
    onProgress: (text, index) => {
      setProgress({
        currentText: text,
        currentIndex: index,
        totalSegments: progress.totalSegments,
        isPlaying: true,
      });
    },
  });

  const currentArticle = articles[currentArticleIndex];

  useEffect(() => {
    // Load current article content
    if (currentArticle && mode === 'audio') {
      player.loadContent(currentArticle.content);
      const newProgress = player.getProgress();
      setProgress(newProgress);
    }
  }, [currentArticleIndex, mode]);

  const handlePlayPause = () => {
    if (playbackState === 'playing') {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleSkipForward = () => {
    player.skipForward(1);
  };

  const handleSkipBackward = () => {
    player.skipBackward(1);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    player.setRate(newSpeed);
  };

  const handlePreviousArticle = () => {
    if (currentArticleIndex > 0) {
      player.stop();
      setCurrentArticleIndex(currentArticleIndex - 1);
    }
  };

  const handleNextArticle = () => {
    if (currentArticleIndex < articles.length - 1) {
      player.stop();
      setCurrentArticleIndex(currentArticleIndex + 1);
    }
  };

  const handleModeToggle = () => {
    const newMode = mode === 'audio' ? 'read' : 'audio';
    setMode(newMode);
    if (newMode === 'read') {
      player.pause();
    }
  };

  const progressPercentage = progress.totalSegments > 0
    ? (progress.currentIndex / progress.totalSegments) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Journey Context Badge */}
            <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
              Article {currentArticleIndex + 1} of {articles.length}
            </div>
            <h1 className="text-lg font-semibold truncate">
              {currentArticle?.title}
            </h1>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('audio')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'audio'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🎧 Audio
            </button>
            <button
              onClick={() => setMode('read')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'read'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📖 Read
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-surface/50 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{Math.round(progressPercentage)}% complete</span>
            <span>
              {progress.currentIndex} / {progress.totalSegments} sections
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {mode === 'audio' ? (
          // Audio Mode - Focus on listening
          <div className="text-center py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4">
                {currentArticle?.title}
              </h2>
              <p className="text-gray-400">
                {progress.currentText || 'Ready to play'}
              </p>
            </div>

            {/* Large Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="w-24 h-24 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all mx-auto mb-8"
            >
              {playbackState === 'playing' ? (
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip Controls */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={handleSkipBackward}
                className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-lg text-sm font-medium transition-colors"
              >
                ◀◀ 15s
              </button>
              <button
                onClick={handleSkipForward}
                className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-lg text-sm font-medium transition-colors"
              >
                15s ▶▶
              </button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-400">Speed:</span>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    speed === s
                      ? 'bg-primary text-white'
                      : 'bg-surface hover:bg-surface/80 text-gray-400'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Read Mode - Article content
          <div className="prose prose-invert max-w-none">
            <article className="bg-surface rounded-lg p-8 mb-8">
              <h2 className="text-3xl font-bold mb-4">
                {currentArticle?.title}
              </h2>
              <div className="text-lg leading-relaxed whitespace-pre-wrap">
                {currentArticle?.content}
              </div>
            </article>
          </div>
        )}

        {/* Article Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-700">
          <button
            onClick={handlePreviousArticle}
            disabled={currentArticleIndex === 0}
            className="px-6 py-3 bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            ← Previous
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">
              Journey Progress
            </p>
            <p className="text-2xl font-bold text-primary">
              {currentArticleIndex + 1} / {articles.length}
            </p>
          </div>
          <button
            onClick={handleNextArticle}
            disabled={currentArticleIndex === articles.length - 1}
            className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  );
}
