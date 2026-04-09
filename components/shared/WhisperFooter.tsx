import Link from 'next/link';

export default function WhisperFooter() {
  return (
    <footer className="text-center py-12 space-y-2">
      <p className="text-mist/40 text-sm">
        No algorithms. No feeds.
      </p>
      <nav className="flex justify-center gap-4 text-xs flex-wrap">
        <Link href="/mirror" className="text-gold/50 hover:text-gold transition-colors">
          Mirror
        </Link>
        <span className="text-mist/20">&middot;</span>
        <Link href="/" className="text-mist/50 hover:text-mist transition-colors">
          Home
        </Link>
        <span className="text-mist/20">&middot;</span>
        <Link href="/articles" className="text-mist/50 hover:text-mist transition-colors">
          Articles
        </Link>
        <span className="text-mist/20">&middot;</span>
        <Link href="/resonances" className="text-rose/50 hover:text-rose transition-colors">
          Resonances
        </Link>
      </nav>
    </footer>
  );
}
