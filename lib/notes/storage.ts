/**
 * Storage adapter for margin notes.
 * Handles localStorage persistence with proper namespacing.
 */

import type { Note } from '@/types/note';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@/lib/utils/storage';

const NOTES_STORAGE_KEY = 'margin_notes';
const POST_NOTES_PREFIX = 'post_notes_';

interface NotesStorageSchema {
  [postId: string]: Note[];
}

/**
 * Load all notes from localStorage.
 *
 * @returns Object mapping post IDs to their notes
 */
export function loadAllNotes(): NotesStorageSchema {
  const stored = safeGetItem<NotesStorageSchema>(NOTES_STORAGE_KEY);
  return stored || {};
}

/**
 * Load notes for a specific post.
 *
 * @param postId - The post ID to load notes for
 * @returns Array of notes for this post
 */
export function loadNotesForPost(postId: string): Note[] {
  const allNotes = loadAllNotes();
  return allNotes[postId] || [];
}

/**
 * Save notes for a specific post.
 *
 * @param postId - The post ID
 * @param notes - Array of notes to save
 * @returns true if successful
 */
export function saveNotesForPost(postId: string, notes: Note[]): boolean {
  const allNotes = loadAllNotes();
  allNotes[postId] = notes;
  return safeSetItem(NOTES_STORAGE_KEY, allNotes);
}

/**
 * Add a new note to storage.
 *
 * @param note - The note to add
 * @returns true if successful
 */
export function addNote(note: Note): boolean {
  const notes = loadNotesForPost(note.postId);
  notes.push(note);
  return saveNotesForPost(note.postId, notes);
}

/**
 * Update an existing note.
 *
 * @param postId - The post ID
 * @param noteId - The note ID to update
 * @param updates - Partial note updates
 * @returns true if successful, false if note not found
 */
export function updateNote(
  postId: string,
  noteId: string,
  updates: Partial<Omit<Note, 'id' | 'postId'>>
): boolean {
  const notes = loadNotesForPost(postId);
  const index = notes.findIndex(n => n.id === noteId);

  if (index === -1) return false;

  notes[index] = { ...notes[index], ...updates };
  return saveNotesForPost(postId, notes);
}

/**
 * Delete a note from storage.
 *
 * @param postId - The post ID
 * @param noteId - The note ID to delete
 * @returns true if successful, false if note not found
 */
export function deleteNote(postId: string, noteId: string): boolean {
  const notes = loadNotesForPost(postId);
  const filtered = notes.filter(n => n.id !== noteId);

  if (filtered.length === notes.length) return false;

  return saveNotesForPost(postId, filtered);
}

/**
 * Clear all notes for a specific post.
 *
 * @param postId - The post ID
 * @returns true if successful
 */
export function clearNotesForPost(postId: string): boolean {
  const allNotes = loadAllNotes();
  delete allNotes[postId];
  return safeSetItem(NOTES_STORAGE_KEY, allNotes);
}

/**
 * Export notes for a post as Markdown format.
 *
 * @param postId - The post ID
 * @returns Markdown string with all notes
 */
export function exportNotesAsMarkdown(postId: string): string {
  const notes = loadNotesForPost(postId);

  if (notes.length === 0) {
    return '# No notes\n\nNo notes found for this post.';
  }

  let markdown = `# Margin Notes\n\n`;
  markdown += `Exported: ${new Date().toISOString()}\n\n`;
  markdown += `---\n\n`;

  notes.forEach((note, index) => {
    markdown += `## Note ${index + 1}\n\n`;
    markdown += `> ${note.text}\n\n`;
    markdown += `**Your note:** ${note.note}\n\n`;
    markdown += `**Date:** ${new Date(note.timestamp).toLocaleString()}\n\n`;
    markdown += `---\n\n`;
  });

  return markdown;
}

// TODO: Add exportAsJSON if needed
// TODO: Add importNotes for restoring from backup
// TODO: Add migration strategy for schema changes
