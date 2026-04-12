/**
 * ReturningPortal — client wrapper that positions ReturnLetter
 * in the Portal (homepage) context.
 *
 * For strangers: renders nothing (the hero and invitation show as-is).
 * For returning readers: renders ReturnLetter above the hero content.
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

export default function ReturningPortal() {
  return (
    <div className="mb-sys-8 animate-fade-in">
      <ReturnLetter />
    </div>
  );
}
