'use client';

import { useState, useEffect } from 'react';
import { getTTSPlayer, TTSState } from '@/lib/audio/tts-player';

interface AudioButtonProps {
  articleId: string;
  articleTitle: string;
  articleContent: string;
  className?: string;
}

/**
 * Audio Button Component
 *
 * A simple button to trigger TTS playback for an article.
 * Shows play/pause state and provides quick access to audio.
 *
 * Design Philosophy (from Tanya):
 * - Icon + text for clarity
 * - Secondary button style (not competing with primary CTAs)
 * - Subtle shadow on hover
 * - Rounded corners (8px)
 * - Clear visual feedback
 */
export function AudioButton({
  articleId,
  articleTitle,
  articleContent,
  className = '',
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [player, setPlayer] = useState(() => getTTSPlayer());

  useEffect(() => {
    // Check if browser supports speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsLoaded(true);
    }
  }, []);

  const handleToggleAudio = () => {
    if (!player.hasContent() || player.getProgress().currentText === '') {
      // Load content first
      player.loadContent(articleContent);
    }

    const currentState = player.getState();

    if (currentState === 'playing') {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  if (!isLoaded) {
    return null; // Browser doesn't support TTS
  }

  return (
    <button
      onClick={handleToggleAudio}
      className={`
        flex items-center gap-2 px-4 py-2
        bg-surface hover:bg-surface/80
        border border-gray-700 hover:border-primary
        rounded-lg transition-all
        text-sm font-medium
        ${className}
      `}
      title={isPlaying ? 'Pause audio' : 'Listen to this article'}
    >
      {/* Audio Icon */}
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {isPlaying ? (
          // Pause icon
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </>
        ) : (
          // Play icon (headphones)
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </>
        )}
      </svg>

      <span>{isPlaying ? 'Pause' : 'Listen to this article'}</span>
    </button>
  );
}
