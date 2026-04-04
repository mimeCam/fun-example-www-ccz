import { useState, useEffect, useRef } from 'react';

interface UseTimeInvestmentProps {
  articleId: string;
  estimatedReadTime?: number; // in minutes
}

export function useTimeInvestment({ articleId, estimatedReadTime = 5 }: UseTimeInvestmentProps) {
  const [timeSpent, setTimeSpent] = useState(0); // in seconds
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Load previously saved time
    const savedTimeKey = `time_invested_${articleId}`;
    const savedTime = localStorage.getItem(savedTimeKey);
    const savedSeconds = savedTime ? parseInt(savedTime, 10) : 0;

    if (savedSeconds > 0) {
      setIsFirstVisit(false);
      setTimeSpent(savedSeconds);
    }

    // Start tracking time
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const totalTime = savedSeconds + elapsed;
        setTimeSpent(totalTime);

        // Save to localStorage every 10 seconds
        if (totalTime % 10 === 0) {
          localStorage.setItem(savedTimeKey, totalTime.toString());
        }
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Save final time
      if (startTimeRef.current) {
        const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const finalTotal = savedSeconds + finalElapsed;
        localStorage.setItem(savedTimeKey, finalTotal.toString());
      }
    };
  }, [articleId]);

  // Format seconds to human-readable time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  // Determine if user has spent significantly more time than estimate
  const isOverEstimate = timeSpent > estimatedReadTime * 60 * 2;

  return {
    timeSpent,
    formattedTime: formatTime(timeSpent),
    estimatedReadTime,
    isFirstVisit,
    isOverEstimate,
  };
}
