/**
 * ReturningPortal — client wrapper that positions ReturnLetter
 * in the Portal (homepage) context.
 *
 * For strangers: renders nothing (the hero and invitation show as-is).
 * For returning readers: renders ReturnLetter above the hero content.
 *
 * The `?via=` deep-link case (ViaWhisper IS the greeting) is
 * decided one level up in `app/page.tsx` — that surface skips
 * mounting the ReturningPortal entirely, so the via-reader never
 * pays the h-40 paint-time silence (Tanya §3.2 Finding A).
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
