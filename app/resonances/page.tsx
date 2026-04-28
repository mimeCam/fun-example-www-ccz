/**
 * /resonances — "The Book of You"
 * A reader's captured resonances assembled into a living document.
 * Server component shell — all interactivity lives in ResonancesClient.
 */
import ResonancesClient from './ResonancesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resonances — The Book of You',
  description: 'The ideas that moved you, captured in your own words.',
};

export default function ResonancesPage() {
  // Wrap-and-strip (Mike #4 §POI 1, Mike #5 §3c, Tanya UIX 2026-04-28 §3.3):
  // the chassis seam (T1) lives on the body wrapper inside
  // `ResonancesClient.tsx` (the `max-w-2xl` block that owns max-width +
  // horizontal padding once a reader is past the loading/empty branches).
  // The shell here keeps only horizontal gutters; vertical padding is
  // owned downstream so the seam isn't double-counted.
  return (
    <main id="main-content" className="min-h-screen px-sys-4 md:px-sys-6">
      <ResonancesClient />
    </main>
  );
}
