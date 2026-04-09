'use client';

interface NewContentBadgeProps {
  label?: string;
}

export function NewContentBadge({ label = 'New' }: NewContentBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-cyan bg-cyan/10 rounded-md">
      <span>✦</span>
      <span>{label}</span>
    </span>
  );
}
