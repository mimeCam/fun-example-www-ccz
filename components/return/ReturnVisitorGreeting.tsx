/**
 * ReturnVisitorGreeting — archetype-aware subtitle for returning readers.
 *
 * Renders on the homepage below the hero heading. First-time visitors see
 * the original subtitle unchanged. Returning readers see their archetype
 * woven into the tagline. Client-only (reads localStorage).
 */

'use client';

import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';

const ARCHETYPE_GREETINGS: Record<string, string> = {
  'deep-diver': 'Still diving deep? See what\u2019s new beneath the surface.',
  'explorer': 'Still an Explorer? See what\u2019s new.',
  'faithful': 'Back again. The consistent ones find the deepest ideas.',
  'resonator': 'Something resonated before. There\u2019s more to echo.',
  'collector': 'Your library grows. New ideas await.',
};

export function ReturnVisitorGreeting() {
  const recognition = useReturnRecognition();

  if (!recognition.isReturning || !recognition.archetype) return null;

  const greeting = ARCHETYPE_GREETINGS[recognition.archetype];
  if (!greeting) return null;

  return (
    <p className="text-mist/50 text-base max-w-2xl mx-auto mt-2 font-display italic">
      {greeting}
    </p>
  );
}
