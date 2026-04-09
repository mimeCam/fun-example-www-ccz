import Link from 'next/link';

export function GemHome() {
  return (
    <Link
      href="/"
      className="fixed top-4 left-4 z-30 text-mist/30 hover:text-gold transition-colors"
      aria-label="Home"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 9l10 13L22 9L12 2z" />
      </svg>
    </Link>
  );
}
