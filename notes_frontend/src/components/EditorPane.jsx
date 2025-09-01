import React, { useEffect, useRef, useState } from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * PUBLIC_INTERFACE
 * Main editor area for viewing and editing the selected note.
 */
export default function EditorPane() {
  const { currentNote, actions, selectedId } = useNotes();
  const [title, setTitle] = useState(currentNote?.title || '');
  const [content, setContent] = useState(currentNote?.content || '');
  const [savedAt, setSavedAt] = useState(null);
  const saveTimeout = useRef();

  // Sync inputs when current note changes
  useEffect(() => {
    setTitle(currentNote?.title || '');
    setContent(currentNote?.content || '');
    setSavedAt(null);
  }, [currentNote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save after small debounce
  useEffect(() => {
    if (!selectedId) return;
    if (!currentNote) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      if (title !== currentNote.title || content !== currentNote.content) {
        actions.updateNote(selectedId, { title, content });
        setSavedAt(Date.now());
      }
    }, 400);

    return () => clearTimeout(saveTimeout.current);
  }, [title, content, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentNote) {
    return (
      <section className="editor-pane">
        <div className="editor empty-state">
          <div className="empty-card">
            <h3>No note selected</h3>
            <p>Create a new note or select one from the sidebar.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="editor-pane" aria-label="Editor">
      <div className="editor-toolbar">
        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {savedAt
            ? `Saved ${new Date(savedAt).toLocaleTimeString()}`
            : 'Changes are saved automatically'}
        </span>
      </div>
      <div className="editor">
        <input
          className="input-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          aria-label="Note title"
        />
        <textarea
          className="textarea-body"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your note..."
          aria-label="Note content"
        />
      </div>
    </section>
  );
}
