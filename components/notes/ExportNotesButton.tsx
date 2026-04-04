'use client';

import { useState, useEffect } from 'react';
import { loadNotesForPost } from '@/lib/notes/storage';

interface ExportNotesButtonProps {
  postId: string;
  articleTitle: string;
  articleUrl: string;
  articleDate?: string;
}

/**
 * Export Notes Button - Beautiful, invisible software
 * Shows only when notes exist, exports to Markdown with one click
 *
 * Design Spec (Tanya Donska):
 * - Indigo-purple gradient background
 * - 12px rounded corners
 * - Multi-layer shadows for 3D depth
 * - Download icon
 * - 2000ms success state
 * - Badge pop animation
 * - WCAG 2.1 AAA compliant
 */
export function ExportNotesButton({
  postId,
  articleTitle,
  articleUrl,
  articleDate,
}: ExportNotesButtonProps) {
  const [noteCount, setNoteCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for notes on mount and when postId changes
  useEffect(() => {
    const notes = loadNotesForPost(postId);
    setNoteCount(notes.length);
  }, [postId]);

  // Don't render if no notes (progressive disclosure)
  if (noteCount === 0) {
    return null;
  }

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      // Import dynamically to avoid SSR issues
      const { generateEnhancedMarkdown } = await import('@/lib/notes/markdown-generator');
      const notes = loadNotesForPost(postId);

      // Generate markdown with article metadata
      const markdown = generateEnhancedMarkdown(notes, {
        title: articleTitle,
        url: articleUrl,
        date: articleDate || new Date().toISOString(),
      });

      // Generate filename from article title
      const sanitizedTitle = articleTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      const filename = `notes-${sanitizedTitle}-${Date.now()}.md`;

      // Trigger download
      downloadMarkdown(markdown, filename);

      // Show success state
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      // TODO: Show error notification to user
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="
        group relative
        px-4 py-2
        bg-gradient-to-br from-indigo-500 to-purple-600
        rounded-[12px]
        text-white font-medium text-sm
        shadow-[0_2px_8px_rgba(99,102,241,0.3)]
        hover:shadow-[0_4px_16px_rgba(99,102,241,0.4),0_0_0_1px_rgba(255,255,255,0.1)]
        active:shadow-[0_2px_4px_rgba(99,102,241,0.3)]
        disabled:opacity-70 disabled:cursor-not-allowed
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900
        overflow-hidden
      "
      aria-label={`Export ${noteCount} note${noteCount > 1 ? 's' : ''} as Markdown`}
      title={`Export your ${noteCount} note${noteCount > 1 ? 's' : ''} as a Markdown file`}
    >
      {/* Success overlay */}
      <div
        className={`
          absolute inset-0 bg-green-500
          transition-opacity duration-300 ease-out
          ${showSuccess ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Badge for note count */}
      <span
        className="
          absolute -top-1 -right-1
          min-w-[18px] h-[18px]
          px-1
          bg-white text-purple-600
          text-[10px] font-bold
          rounded-full
          flex items-center justify-center
          shadow-sm
          animate-badge-pop
        "
      >
        {noteCount}
      </span>

      {/* Button content */}
      <span className="relative flex items-center gap-2">
        {/* Download icon */}
        <svg
          className={`
            w-4 h-4
            transition-transform duration-200
            ${isExporting ? 'animate-bounce' : 'group-hover:translate-y-0.5'}
          `}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>

        {/* Text label */}
        <span className="relative">
          {showSuccess ? 'Exported!' : isExporting ? 'Exporting...' : 'Export Notes'}
        </span>
      </span>

      {/* Subtle chromatic aberration on hover */}
      <div
        className="
          absolute inset-0 rounded-[12px]
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          pointer-events-none
        "
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,0,0,0.1) 50%, transparent 100%)',
          mixBlendMode: 'overlay',
        }}
      />
    </button>
  );
}

/**
 * Trigger browser download of markdown file
 * Uses Blob API for client-side file generation
 */
function downloadMarkdown(markdown: string, filename: string): void {
  // Create blob with proper MIME type
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });

  // Create object URL
  const url = URL.createObjectURL(blob);

  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// TODO: Add keyboard shortcut (Cmd/Ctrl + E)
// TODO: Add floating action button for mobile
// TODO: Add export format selection (Markdown, JSON, Plain Text)
