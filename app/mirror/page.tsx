'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMirror } from '@/lib/hooks/useMirror';
import MirrorRevealCard from '@/components/mirror/MirrorRevealCard';

export default function MirrorPage() {
  const [email, setEmail] = useState('');
  const [isReady, setIsReady] = useState(false);
  const { mirror, loading, error, refresh } = useMirror();

  useEffect(() => {
    if (localStorage.getItem('user-email')) setIsReady(true);
  }, []);

  useEffect(() => { if (isReady) refresh(); }, [isReady, refresh]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email?.includes('@')) {
      localStorage.setItem('user-email', email);
      setIsReady(true);
    }
  };

  if (!isReady) return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto pt-20 text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Your Mirror</h1>
        <p className="text-gray-400 mb-2">Every article you read leaves a fingerprint.</p>
        <p className="text-gray-500 text-sm mb-8">
          Enter your email to see the reader you&apos;ve become.
        </p>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 bg-surface rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary mb-4"
            required />
          <button type="submit"
            className="w-full px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors">
            Reveal My Mirror
          </button>
        </form>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="mirror-pulse w-80 h-96 rounded-3xl bg-gradient-to-b from-primary/20 to-secondary/10 border border-primary/20" />
    </div>
  );

  if (error || !mirror) return (
    <div className="min-h-screen p-8 text-center pt-20">
      <h1 className="text-3xl font-bold text-white mb-4">Not Enough Reflections Yet</h1>
      <p className="text-gray-400 mb-6">{error || 'Read a few articles first, then come back to see your mirror.'}</p>
      <Link href="/" className="text-primary hover:text-accent transition-colors">&larr; Back to Articles</Link>
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto pt-8">
        <MirrorRevealCard mirror={mirror} />
        <div className="text-center mt-8 space-y-3">
          <p className="text-gray-500 text-xs">Your archetype is based on your reading patterns, depth, and consistency.</p>
          <Link href="/" className="text-primary hover:text-accent transition-colors text-sm">
            &larr; Back to Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
