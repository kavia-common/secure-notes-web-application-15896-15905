import React from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * PUBLIC_INTERFACE
 * Top navigation bar containing brand and actions.
 *
 * Accepts optional props:
 * - viewMode: 'editor' | 'calendar'
 * - onChangeView: (mode) => void
 */
export default function Topbar({ viewMode = 'editor', onChangeView = () => {} }) {
  const { actions, selectedId } = useNotes();

  const handleDelete = () => {
    if (!selectedId) return;
    // Simple confirm to avoid accidental deletion
    if (window.confirm('Delete this note? This action cannot be undone.')) {
      actions.deleteNote(selectedId);
    }
  };

  const isEditor = viewMode === 'editor';
  const isCalendar = viewMode === 'calendar';

  return (
    <header className="topbar" role="banner">
      <div className="brand" aria-label="Application brand">
        <div className="brand-badge">N</div>
        <div>Notes</div>
      </div>
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div role="tablist" aria-label="View switch" style={{ display: 'flex', gap: 6 }}>
          <button
            role="tab"
            aria-selected={isEditor}
            className="btn"
            onClick={() => onChangeView('editor')}
            title="Editor/List view"
          >
            📝 Editor
          </button>
          <button
            role="tab"
            aria-selected={isCalendar}
            className="btn"
            onClick={() => onChangeView('calendar')}
            title="Calendar view"
          >
            📅 Calendar
          </button>
        </div>
        <div style={{ width: 12 }} />
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
