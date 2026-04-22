/**
 * KeepsakeLauncher — the "Keep this thread" CTA + modal host.
 *
 * Intentionally split from ResonanceDrawer so the mirror fetch +
 * keepsake code path only activate when the ceremony has truly
 * settled. Mounting it conditionally keeps cold article reads from
 * pinging /api/mirror or paying for keepsake scaffolding.
 */
'use client';

import { useCallback, useState } from 'react';
import { ThreadKeepsake } from '@/components/reading/ThreadKeepsake';
import { captureThreadSnapshot } from '@/lib/hooks/useThreadSnapshot';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useThermal } from '@/components/thermal/ThermalProvider';
import { useMirror } from '@/lib/hooks/useMirror';
import type { ArchetypeKey } from '@/types/content';
import type { ThreadSnapshot } from '@/lib/sharing/thread-render';

interface KeepsakeLauncherProps {
  articleId: string;
  articleTitle: string;
}

export function KeepsakeLauncher({ articleId, articleTitle }: KeepsakeLauncherProps) {
  const { score } = useThermal();
  const { maxDepth } = useScrollDepth();
  const { mirror } = useMirror();
  const archetype = (mirror?.archetype as ArchetypeKey | undefined) ?? null;
  const [snapshot, setSnapshot] = useState<ThreadSnapshot | null>(null);

  const onOpen = useCallback(() => {
    setSnapshot(captureThreadSnapshot(
      { slug: articleId, title: articleTitle, archetype },
      maxDepth, score,
    ));
  }, [articleId, articleTitle, archetype, maxDepth, score]);

  const onClose = useCallback(() => setSnapshot(null), []);

  return (
    <>
      <div className="mt-sys-5 flex justify-center">
        <button
          onClick={onOpen}
          className="px-sys-5 py-sys-3 rounded-sys-medium border border-gold/40 text-gold
                     text-sys-caption hover:bg-gold/10 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2
                     focus:ring-offset-surface"
        >
          Keep this thread →
        </button>
      </div>
      <ThreadKeepsake isOpen={!!snapshot} onClose={onClose} snapshot={snapshot} />
    </>
  );
}
