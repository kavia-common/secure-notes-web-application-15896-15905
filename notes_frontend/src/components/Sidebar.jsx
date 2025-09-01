import React from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * PUBLIC_INTERFACE
 * Sidebar for search and note navigation.
 */
export default function Sidebar() {
  const { filteredNotes, selectedId, actions, query } = useNotes();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="search-box" role="search">
          <span aria-hidden="true" style={{ color: '#6b7280' }}>🔎</span>
          <input
            aria-label="Search notes"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => actions.setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="notes-list">
        {filteredNotes.length === 0 && (
          <div className="empty-card">
            <h3>No notes found</h3>
            <p>Try creating a new note or adjust your search.</p>
            <button className="btn btn-primary" onClick={actions.createNote}>New note</button>
          </div>
        )}
        {filteredNotes.map(note => {
          const isActive = note.id === selectedId;
          const snippet = (note.content || '').replace(/\n+/g, ' ').slice(0, 80);
          const updated = new Date(note.updatedAt).toLocaleString();
          return (
            <div
              key={note.id}
              className={`note-item ${isActive ? 'active' : ''}`}
              onClick={() => actions.selectNote(note.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') actions.selectNote(note.id); }}
              aria-pressed={isActive}
            >
              <div className="note-title">{note.title || 'Untitled note'}</div>
              <div className="note-snippet">{snippet || 'No content yet.'}</div>
              <div className="note-meta">
                <span>{updated}</span>
                {isActive && <span style={{ color: 'var(--color-primary)' }}>Selected</span>}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
