'use client';

interface NewContentBadgeProps {
  label?: string;
}

export function NewContentBadge({ label = 'New' }: NewContentBadgeProps) {
  return (
    <span className="inline-flex items-center gap-sys-1 px-sys-2 py-sys-1 text-sys-micro font-medium text-cyan bg-cyan/10 rounded-sys-soft">
      <span>✦</span>
      <span>{label}</span>
    </span>
  );
}
