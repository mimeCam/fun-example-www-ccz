/**
 * ReadingInvitation — "Begin Reading" CTA with behavioral hint.
 *
 * The primary consent surface on the homepage. The `thermal-candle`
 * pulse (dormant-state gold glow) sits on the child <Link> — layer
 * ceremony, not press feedback.
 *
 * Server component — no hooks, no state.
 */

import Link from 'next/link';
import { Pressable } from '@/components/shared/Pressable';

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

  // mt-sys-11 (was mt-sys-10): the CTA needs one extra spacing step now
  // that the prose is markdown-clean — the pill should breathe; the hint
  // stays whispered. (Tanya §3.2 Finding B)
  return (
    <div className="text-center mt-sys-11 mb-sys-11">
      <Pressable asChild variant="solid" size="md" className="thermal-candle">
        <Link href={`/article/${articleId}`}>
          Begin Reading &rarr;
        </Link>
      </Pressable>

      <p className="text-mist/50 text-sys-caption mt-sys-7 italic max-w-sm mx-auto">
        {hint}
      </p>
    </div>
  );
}
