'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
}

interface SearchBarProps {
  // No props needed - handles its own navigation
}

/**
 * Simple search component for article discovery
 * Performs client-side search over sample articles
 */
export default function SearchBar({}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // TODO: Replace with actual article data from API/database
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);

    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/articles?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (articleId: string) => {
    router.push(`/article/${articleId}`);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
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
              <div className="text-white font-medium mb-1">{result.title}</div>
              {result.snippet && (
                <div className="text-sm text-gray-400 line-clamp-2">{result.snippet}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
