/**
 * Enhanced Markdown Generator for Notes Export
 * Converts margin notes into beautifully formatted Markdown documents
 */

import type { Note } from '@/types/note';

export interface ArticleMetadata {
  title: string;
  url: string;
  date: string;
}

/**
 * Generate enhanced Markdown from notes with rich formatting
 *
 * Features:
 * - YAML frontmatter with metadata
 * - Blockquotes for highlighted text
 * - Backlinks to original article
 * - Human-readable timestamps
 * - SEO-friendly structure
 */
export function generateEnhancedMarkdown(
  notes: Note[],
  metadata: ArticleMetadata
): string {
  if (notes.length === 0) {
    return generateEmptyMarkdown(metadata);
  }

  const sections: string[] = [];

  // 1. YAML Frontmatter
  sections.push(generateFrontmatter(metadata, notes));

  // 2. Header section
  sections.push(generateHeader(metadata));

  // 3. Notes content
  sections.push(generateNotesContent(notes, metadata));

  // 4. Footer
  sections.push(generateFooter(metadata));

  return sections.join('\n\n');
}

/**
 * Generate YAML frontmatter for Markdown file
 */
function generateFrontmatter(metadata: ArticleMetadata, notes: Note[]): string {
  const exportDate = new Date().toISOString();
  const noteCount = notes.length;

  return `---
title: "Notes: ${escapeForMarkdown(metadata.title)}"
description: "Margin notes exported from ${metadata.title}"
created: "${exportDate}"
source: "${metadata.url}"
article_date: "${metadata.date}"
note_count: ${noteCount}
tags: [notes, highlights, margins]
---`;
}

/**
 * Generate document header
 */
function generateHeader(metadata: ArticleMetadata): string {
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const articleDate = new Date(metadata.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `# Margin Notes

**Source:** [${escapeForMarkdown(metadata.title)}](${metadata.url})
**Exported:** ${exportDate}
**Article Published:** ${articleDate}

---`;
}

/**
 * Generate notes content with highlights and annotations
 */
function generateNotesContent(notes: Note[], metadata: ArticleMetadata): string {
  const sections: string[] = [];

  // Group notes by whether they have user annotations
  const highlightsWithNotes = notes.filter(n => n.note.trim().length > 0);
  const highlightsOnly = notes.filter(n => n.note.trim().length === 0);

  // Section 1: Annotated Highlights (most important)
  if (highlightsWithNotes.length > 0) {
    sections.push('## Annotated Highlights\n');
    sections.push('Highlights with your personal notes:\n');

    highlightsWithNotes.forEach((note, index) => {
      sections.push(formatAnnotatedNote(note, index + 1, metadata.url));
    });
  }

  // Section 2: Quick Highlights (no annotations)
  if (highlightsOnly.length > 0) {
    sections.push('## Quick Highlights\n');
    sections.push('Passages you found interesting:\n');

    highlightsOnly.forEach((note, index) => {
      sections.push(formatQuickHighlight(note, index + 1));
    });
  }

  return sections.join('\n');
}

/**
 * Format a single annotated note
 */
function formatAnnotatedNote(note: Note, index: number, articleUrl: string): string {
  const timestamp = formatTimestamp(note.timestamp);
  const highlightedText = escapeForMarkdown(note.text);
  const userNote = escapeForMarkdown(note.note);

  return `### ${index}. ${extractPreview(highlightedText)}

> ${highlightedText}

**Your Note:** ${userNote}

*Added on ${timestamp}*

---`;
}

/**
 * Format a quick highlight (without annotation)
 */
function formatQuickHighlight(note: Note, index: number): string {
  const timestamp = formatTimestamp(note.timestamp);
  const highlightedText = escapeForMarkdown(note.text);

  return `${index}. > ${highlightedText}`
+ `

*${timestamp}*

`;
}

/**
 * Generate document footer
 */
function generateFooter(metadata: ArticleMetadata): string {
  return `---

*Generated from [${escapeForMarkdown(metadata.title)}](${metadata.url})*
*Exported with love from the Persona Blog Notes System*

---

## How to Use These Notes

1. **Backlink:** Click the source link above to return to the original article
2. **Search:** These notes are now searchable in your note-taking app
3. **Remix:** Feel free to reorganize, summarize, or expand on these notes
4. **Share:** These are your private thoughts - share only if you wish

> *"Your thoughts, rescued from the void."*`;
}

/**
 * Generate empty notes markdown
 */
function generateEmptyMarkdown(metadata: ArticleMetadata): string {
  return `# No Notes Found

You haven't created any margin notes for this article yet.

**Source:** [${escapeForMarkdown(metadata.title)}](${metadata.url})

---

*Start highlighting text to create your first note!*`;
}

/**
 * Format timestamp for human reading
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Extract preview text from highlighted text
 */
function extractPreview(text: string, maxLength = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Escape special Markdown characters
 */
function escapeForMarkdown(text: string): string {
  // Escape backslashes first
  let escaped = text.replace(/\\/g, '\\\\');

  // Escape special characters
  const specialChars = ['*', '_', '[', ']', '(', ')', '#', '`', '>', '|', '-'];
  specialChars.forEach(char => {
    const regex = new RegExp(`\\${char}`, 'g');
    escaped = escaped.replace(regex, `\\${char}`);
  });

  return escaped;
}

// TODO: Add custom templates option
// TODO: Add tag/category support in output
// TODO: Add related notes section (if linking between articles)
// TODO: Add summary generation from notes
