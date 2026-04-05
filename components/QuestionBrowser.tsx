/**
 * QuestionBrowser - Explore content through provocative questions
 *
 * Simple question discovery interface with search and serendipity modes
 * // TODO: Add question filtering by topic/category
 * // TODO: Add engagement analytics tracking
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Question {
  question: string;
  articleId: string;
  articleTitle: string;
}

export function QuestionBrowser() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'all' | 'random'>('random');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const params = new URLSearchParams({
        mode: searchQuery ? 'search' : mode,
        ...(searchQuery && { q: searchQuery }),
        count: '12',
      });

      const response = await fetch(`/api/questions?${params}`);
      const data = await response.json();
      setQuestions(data);
      setLoading(false);
    }

    fetchQuestions();
  }, [mode, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Explore by Question</h1>
        <p className="text-gray-600">Discover content through provocative questions</p>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[250px] px-4 py-2 border rounded-lg"
        />
        <button
          onClick={() => setMode('random')}
          className={`px-4 py-2 rounded-lg ${
            mode === 'random' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Serendipity
        </button>
        <button
          onClick={() => setMode('all')}
          className={`px-4 py-2 rounded-lg ${
            mode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          All Questions
        </button>
      </div>

      {/* Questions Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading questions...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {questions.map(({ question, articleId, articleTitle }) => (
            <Link
              key={`${articleId}-${question}`}
              href={`/article/${articleId}`}
              className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="text-lg font-medium mb-2">{question}</div>
              <div className="text-sm text-gray-500">From: {articleTitle}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && questions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No questions found. Try a different search term.
        </div>
      )}
    </div>
  );
}
