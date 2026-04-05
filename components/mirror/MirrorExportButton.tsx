'use client';

import { useState } from 'react';
import type { ReaderMirror } from '@/types/mirror';
import { generateMirrorCard } from '@/lib/mirror/card-generator';
import { exportQuoteCard } from '@/lib/quote-cards/export-utils';

interface Props { mirror: ReaderMirror; }

export default function MirrorExportButton({ mirror }: Props) {
  const [busy, setBusy] = useState(false);

  const handleExport = async (method: 'download' | 'clipboard') => {
    setBusy(true);
    try {
      const dataUrl = generateMirrorCard(mirror);
      await exportQuoteCard(dataUrl, method, {
        filename: `mirror-${mirror.archetype}-${Date.now()}.png`,
      });
    } finally { setBusy(false); }
  };

  return (
    <div className="flex gap-3 justify-center mt-6">
      <button
        onClick={() => handleExport('download')}
        disabled={busy}
        className="px-4 py-2 bg-primary/30 hover:bg-primary/50 text-accent
          rounded-lg text-sm transition-colors disabled:opacity-40"
      >{busy ? 'Generating…' : 'Download PNG'}</button>
      <button
        onClick={() => handleExport('clipboard')}
        disabled={busy}
        className="px-4 py-2 bg-primary/30 hover:bg-primary/50 text-accent
          rounded-lg text-sm transition-colors disabled:opacity-40"
      >{busy ? 'Copying…' : 'Copy to Clipboard'}</button>
    </div>
  );
}
