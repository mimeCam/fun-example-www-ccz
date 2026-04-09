// Margin Notes feature types
// Private, local-first note-taking for blog articles

export interface Note {
  id: string;
  postId: string;
  highlightId: string;
  text: string; // The highlighted text
  note: string; // User's private note
  timestamp: number;
  position: {
    startOffset: number;
    endOffset: number;
    elementId?: string;
  };
}

export interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  isPanelOpen: boolean;
}

export interface TextSelection {
  text: string;
  range: Range;
  rect: DOMRect;
}

