/**
 * NewContentBadge — gold ✦ icon that appears on newly discovered content.
 *
 * Renders briefly (3s) when a content layer is revealed for the first time.
 * The "you've unlocked something" moment. Then it fades to nothing.
 */

'use client';

import { useState, useEffect } from 'react';

interface Props {
  label?: string;
}

export function NewContentBadge({ label }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <span
      className="inline-flex items-center gap-1 text-[#f0c674] text-xs uppercase tracking-widest font-medium"
      style={{ transition: 'opacity 0.6s ease', opacity: visible ? 1 : 0 }}
    >
      ✦ {label ?? 'New'}
    </span>
  );
}
