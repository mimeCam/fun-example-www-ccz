/**
 * ReadingInvitation — "Begin Reading" CTA with behavioral hint.
 *
 * A single focused call-to-action that bridges the Portal hero
 * to the article page. Uses gold token (ties homepage invitation
 * to the eventual archetype reveal on the article page).
 *
 * The "lit candle" in dormant state — thermal-candle provides a
 * subtle gold pulse that says "this page is alive" even when cold.
 *
 * Server component — no hooks, no state.
 */

import Link from 'next/link';

// ─── Social proof hints ───────────────────────────────────

const HINTS = [
  'Keep reading. The Mirror is already watching.',
  'Most readers find their reflection within the first article',
  'The blog reads you back — if you let it',
];

function pickHint(articleId: string): string {
  // Deterministic pick based on article id — no Math.random at build time
  const idx = articleId.length % HINTS.length;
  return HINTS[idx];
}

// ─── Component ────────────────────────────────────────────

export default function ReadingInvitation(
  { articleId }: { articleId: string }
) {
  const hint = pickHint(articleId);

  return (
    <div className="text-center mt-12 mb-16">
      <Link href={`/article/${articleId}`}
        className="inline-block px-8 py-3.5 rounded-lg
          bg-gold/10 border border-gold/30 text-gold
          font-display font-semibold text-lg
          hover:bg-gold/20 hover:border-gold/50 hover:shadow-gold
          hover:-translate-y-micro active:translate-y-0
          transition-all duration-enter
          focus:ring-2 focus:ring-gold/40 focus:ring-offset-2
          focus:ring-offset-background outline-none
          thermal-candle thermal-glow">
        Begin Reading &rarr;
      </Link>

      <p className="text-mist/50 text-sm mt-6 italic max-w-sm mx-auto">
        {hint}
      </p>
    </div>
  );
}
