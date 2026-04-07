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
  return (
    <main className="min-h-screen p-8">
      <ResonancesClient />
    </main>
  );
}
