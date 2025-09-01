import React from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * PUBLIC_INTERFACE
 * Top navigation bar containing brand and actions.
 */
export default function Topbar() {
  const { actions, selectedId } = useNotes();

  const handleDelete = () => {
    if (!selectedId) return;
    // Simple confirm to avoid accidental deletion
    if (window.confirm('Delete this note? This action cannot be undone.')) {
      actions.deleteNote(selectedId);
    }
  };

  return (
    <header className="topbar" role="banner">
      <div className="brand" aria-label="Application brand">
        <div className="brand-badge">N</div>
        <div>Notes</div>
      </div>
      <div className="topbar-actions">
        <button className="btn btn-primary" onClick={actions.createNote} aria-label="Create new note">
          New
        </button>
        <button
          className="btn btn-accent"
          onClick={handleDelete}
          disabled={!selectedId}
          aria-label="Delete selected note"
          style={{ opacity: selectedId ? 1 : 0.5, cursor: selectedId ? 'pointer' : 'not-allowed' }}
        >
          Delete
        </button>
      </div>
    </header>
  );
}
