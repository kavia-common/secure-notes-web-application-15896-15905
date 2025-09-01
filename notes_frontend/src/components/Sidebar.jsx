import React from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * PUBLIC_INTERFACE
 * Sidebar for search and note navigation.
 */
export default function Sidebar() {
  const { filteredNotes, selectedId, actions, query, reminders } = useNotes();

  const badgeStyle = (overdue, soon) => {
    if (overdue) return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
    if (soon) return { background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' };
    return { background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' };
  };

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

      {/* Upcoming Reminders */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Upcoming Reminders</strong>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{reminders.length}</span>
        </div>
        {reminders.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No reminders scheduled.</div>
        )}
        {reminders.slice(0, 5).map(r => (
          <div
            key={r.id}
            onClick={() => actions.selectNote(r.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') actions.selectNote(r.id); }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              marginBottom: 6,
              borderRadius: 8,
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: '#fff',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {r.when.toLocaleString()}
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                ...badgeStyle(r.overdue, r.soon)
              }}
            >
              {r.overdue ? 'Overdue' : r.soon ? 'Soon' : 'Scheduled'}
            </span>
          </div>
        ))}
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

          // Small inline reminder chip in list
          let chip = null;
          if (note.reminder) {
            const d = new Date(note.reminder);
            if (!isNaN(d.getTime())) {
              const now = Date.now();
              const t = d.getTime();
              const overdue = t < now;
              const soon = !overdue && t - now <= 24 * 60 * 60 * 1000;
              const label = overdue ? 'Overdue' : soon ? 'Soon' : 'Scheduled';
              chip = (
                <span style={{
                  marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 999,
                  ...badgeStyle(overdue, soon)
                }}>{label}</span>
              );
            }
          }

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
              <div className="note-title">
                {note.title || 'Untitled note'} {chip}
              </div>
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
