/**
 * ReturningPortal — client wrapper that positions ReturnLetter
 * in the Portal (homepage) context.
 *
 * For strangers: renders nothing (the hero and invitation show as-is).
 * For returning readers: renders ReturnLetter above the hero content.
 * When ViaWhisper is present (reader arrived via shared link),
 * suppresses the letter — the whisper IS the greeting.
 *
 * Client-only (reads localStorage via ReturnLetter).
 * SSR-safe — always imported via dynamic() with { ssr: false }.
 */

'use client';

import dynamic from 'next/dynamic';

const ReturnLetter = dynamic(
  () => import('@/components/return/ReturnLetter').then(m => ({ default: m.ReturnLetter })),
  { ssr: false }
);

interface Props {
  /** Suppress the letter when ViaWhisper is showing. */
  suppress?: boolean;
}

export default function ReturningPortal({ suppress }: Props) {
  if (suppress) return null;

  return (
    <div className="mb-sys-8 animate-fade-in">
      <ReturnLetter />
    </div>
  );
}
