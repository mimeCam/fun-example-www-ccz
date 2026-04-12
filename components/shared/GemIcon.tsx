/**
 * GemIcon — the site's soul. One faceted gem diamond, four sizes.
 *
 * The gem represents thermal identity. Every instance must breathe
 * with the same rhythm. Seven inline copies consolidated to one.
 *
 * Thermal color is handled by the parent via className — this keeps
 * the component usable in both server and client contexts.
 */

type GemSize = 'xs' | 'sm' | 'md' | 'lg';

interface GemIconProps {
  size?: GemSize;
  className?: string;
}

const SPECS: Record<GemSize, { dim: number; stroke: number }> = {
  xs: { dim: 16, stroke: 1.5 },
  sm: { dim: 20, stroke: 1.5 },
  md: { dim: 24, stroke: 1.5 },
  lg: { dim: 48, stroke: 1 },
};

export function GemIcon({ size = 'md', className = '' }: GemIconProps) {
  const { dim, stroke } = SPECS[size];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={dim} height={dim}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M12 3l4 6-4 13-4-13z" />
    </svg>
  );
}
