'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
  matchedTags: string[];
}

interface SearchBarProps {
  // No props needed - handles its own navigation
}

/**
 * Enhanced search component with fuzzy matching
 * Features debounced search, relevance scores, and matched tags
 */
export default function SearchBar({}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search with 300ms delay
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowNoResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowNoResults(false);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/articles?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setShowNoResults(data.length === 0);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([]);
        setShowNoResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (articleId: string) => {
    router.push(`/article/${articleId}`);
    setQuery('');
    setResults([]);
    setShowNoResults(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="w-full px-4 py-3 bg-surface border border-surface rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result.id)}
              className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium mb-1 truncate">{result.title}</div>
                  {result.snippet && (
                    <div className="text-sm text-gray-400 line-clamp-2">{result.snippet}</div>
                  )}
                  {result.matchedTags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {result.matchedTags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {Math.round((1 - result.score) * 100)}% match
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showNoResults && !isSearching && (
        <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg px-4 py-3 text-center text-gray-400">
          No articles found. Try different keywords.
        </div>
      )}
    </div>
  );
}
