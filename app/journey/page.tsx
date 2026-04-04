'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReadingDashboard from '@/components/ReadingDashboard';
import { JourneyOverview } from '@/components/journey/JourneyOverview';

/**
 * Reading Journey Page
 *
 * A private space for readers to see their growth over time.
 * Displays reading timeline, streaks, and topic exploration.
 *
 * Design Philosophy (from Tanya):
 * - Dedicated page (not cluttering the homepage)
 * - Private by default (no social pressure)
 * - Visual timeline of growth
 * - Resurface articles to revisit
 * - Optional growth metrics
 */
export default function JourneyPage() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [isEmailSet, setIsEmailSet] = useState(false);
  const [view, setView] = useState<'dashboard' | 'overview'>('overview');

  useEffect(() => {
    // Check if email is stored in localStorage
    const storedEmail = localStorage.getItem('user-email');
    if (storedEmail) {
      setUserEmail(storedEmail);
      setIsEmailSet(true);
    }
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail && userEmail.includes('@')) {
      localStorage.setItem('user-email', userEmail);
      setIsEmailSet(true);
    }
  };

  if (!isEmailSet) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Your Reading Journey
            </h1>
            <p className="text-gray-400">
              Enter your email to track your reading history and see your growth over time.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your email is privacy-protected and used only to create your personal reading profile.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-surface rounded-lg border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary mb-4"
              required
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors"
            >
              Start Tracking
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Your Reading Journey
            </h1>
            <p className="text-gray-400">
              Track your growth and discover what you've been learning
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
              <button
                onClick={() => setView('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  view === 'overview'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Journey Map
              </button>
              <button
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  view === 'dashboard'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Stats
              </button>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-surface hover:bg-surface/80 rounded-lg transition-colors"
            >
              ← Back to Articles
            </Link>
          </div>
        </header>

        {/* Content based on view */}
        {view === 'overview' ? (
          <JourneyOverview
            journeyId="learning-journey"
            journeyTitle="Deep Learning & AI"
            articles={[
              {
                id: '1',
                title: 'Introduction to Deep Learning',
                description: 'Learn the fundamentals of neural networks and deep learning architectures.',
                completed: true,
                current: false,
                estimatedTime: '8 min read',
              },
              {
                id: '2',
                title: 'Understanding Neural Networks',
                description: 'Dive into the architecture and training of neural networks.',
                completed: true,
                current: false,
                estimatedTime: '12 min read',
              },
              {
                id: '3',
                title: 'Advanced Optimization Techniques',
                description: 'Master gradient descent, momentum, and adaptive learning rates.',
                completed: false,
                current: true,
                estimatedTime: '15 min read',
              },
              {
                id: '4',
                title: 'Convolutional Neural Networks',
                description: 'Explore CNNs for image recognition and computer vision tasks.',
                completed: false,
                current: false,
                estimatedTime: '20 min read',
              },
              {
                id: '5',
                title: 'Recurrent Neural Networks',
                description: 'Understand RNNs and LSTMs for sequence modeling.',
                completed: false,
                current: false,
                estimatedTime: '18 min read',
              },
              {
                id: '6',
                title: 'Transformers and Attention',
                description: 'Learn about the transformer architecture that powers modern AI.',
                completed: false,
                current: false,
                estimatedTime: '25 min read',
              },
            ]}
          />
        ) : (
          <ReadingDashboard userEmail={userEmail} />
        )}
      </div>
    </div>
  );
}
