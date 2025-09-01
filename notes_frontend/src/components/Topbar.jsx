import React, { useEffect, useRef, useState } from 'react';
import { useNotes } from '../context/NotesContext';
import { NoteTemplates } from '../services/templates';

/**
 * PUBLIC_INTERFACE
 * Top navigation bar containing brand and actions.
 *
 * Accepts optional props:
 * - viewMode: 'editor' | 'calendar' | 'kanban' | 'agenda'
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
  const isKanban = viewMode === 'kanban';
  const isAgenda = viewMode === 'agenda';

  const [showTemplates, setShowTemplates] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (e.type === 'keydown' && e.key === 'Escape') {
        setShowTemplates(false);
        return;
      }
      if (e.type === 'mousedown' && !menuRef.current.contains(e.target)) {
        setShowTemplates(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onDoc);
    };
  }, []);

  const createFromTemplate = (key) => {
    if (key === 'blank') {
      actions.createNote();
    } else {
      actions.createNoteFromTemplate?.(key);
    }
    setShowTemplates(false);
    if (viewMode !== 'editor') onChangeView('editor');
  };

  return (
    <header className="topbar" role="banner">
      <div className="brand" aria-label="Application brand">
        <div className="brand-badge">N</div>
        <div>Notes</div>
      </div>
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
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
          <button
            role="tab"
            aria-selected={isAgenda}
            className="btn"
            onClick={() => onChangeView('agenda')}
            title="Daily agenda"
          >
            📋 Agenda
          </button>
          <button
            role="tab"
            aria-selected={isKanban}
            className="btn"
            onClick={() => onChangeView('kanban')}
            title="Kanban board"
          >
            🗂️ Board
          </button>
        </div>
        <div style={{ width: 12 }} />
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowTemplates((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={showTemplates}
            aria-label="Create new note"
            title="Create new note"
          >
            New ▾
          </button>
          {showTemplates && (
            <div
              role="menu"
              aria-label="Note templates"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                minWidth: 280,
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-md)',
                padding: 6,
                zIndex: 20,
                display: 'grid',
                gap: 4,
              }}
            >
              {NoteTemplates.map(t => (
                <button
                  key={t.key}
                  role="menuitem"
                  className="btn"
                  onClick={() => createFromTemplate(t.key)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr',
                    alignItems: 'start',
                    gap: 8,
                    textAlign: 'left',
                    background: 'var(--bw-white)',
                  }}
                  title={t.description}
                >
                  <span aria-hidden="true">{t.emoji}</span>
                  <span>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.description}</div>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
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
