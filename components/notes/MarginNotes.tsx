'use client';

import { useState } from 'react';
import { NotesProvider, useNotesContext } from './NotesProvider';
import { NotesPanel } from './NotesPanel';
import { NotesToggleButton } from './NotesToggleButton';
import { AddNoteTooltip } from './AddNoteTooltip';
import { AddNoteModal } from './AddNoteModal';

interface MarginNotesProps {
  postId: string;
  children: React.ReactNode;
}

/**
 * Complete margin notes integration component.
 * Wraps article content to enable highlighting and note-taking.
 *
 * Usage:
 *   <MarginNotes postId={article.id}>
 *     <YourArticleContent />
 *   </MarginNotes>
 */
export function MarginNotes({ postId, children }: MarginNotesProps) {
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  return (
    <NotesProvider postId={postId}>
      <MarginNotesContent
        showAddNoteModal={showAddNoteModal}
        setShowAddNoteModal={setShowAddNoteModal}
      >
        {children}
      </MarginNotesContent>
    </NotesProvider>
  );
}

interface MarginNotesContentProps {
  children: React.ReactNode;
  showAddNoteModal: boolean;
  setShowAddNoteModal: (show: boolean) => void;
}

function MarginNotesContent({
  children,
  showAddNoteModal,
  setShowAddNoteModal,
}: MarginNotesContentProps) {
  const notesContext = useNotesContext();

  const handleAddNote = (noteText: string) => {
    notesContext.handleAddNote(noteText);
    setShowAddNoteModal(false);
  };

  const handleTooltipAdd = () => {
    setShowAddNoteModal(true);
  };

  return (
    <>
      {/* Notes toggle button in header */}
      <div className="fixed top-4 right-4 z-30">
        <NotesToggleButton
          noteCount={notesContext.notes.length}
          isOpen={notesContext.isPanelOpen}
          onToggle={notesContext.togglePanel}
        />
      </div>

      {/* Article content with highlighting enabled */}
      <div className="relative">
        {children}
      </div>

      {/* Add note tooltip */}
      <AddNoteTooltip
        isVisible={notesContext.showAddNoteTooltip}
        position={notesContext.tooltipPosition}
        onAddNote={handleTooltipAdd}
        onCancel={notesContext.handleCancelNote}
      />

      {/* Add note modal */}
      <AddNoteModal
        isOpen={showAddNoteModal}
        selectedText={notesContext.selectedText}
        onSubmit={handleAddNote}
        onCancel={() => setShowAddNoteModal(false)}
      />

      {/* Notes panel */}
      <NotesPanel
        postId={notesContext.notes[0]?.postId || ''}
        notes={notesContext.notes}
        activeNoteId={notesContext.activeNoteId}
        isOpen={notesContext.isPanelOpen}
        onClose={notesContext.closePanel}
        onUpdateNote={notesContext.handleUpdateNote}
        onDeleteNote={notesContext.handleDeleteNote}
        onActivateNote={notesContext.handleActivateNote}
      />
    </>
  );
}

// TODO: Add keyboard shortcut hint badge
// TODO: Add onboarding tour for first-time users
// TODO: Add export all notes from all articles
