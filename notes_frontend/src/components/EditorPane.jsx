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
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagsLocal, setTagsLocal] = useState(currentNote?.tags || []);
  const saveTimeout = useRef();

  // populate reminder inputs from current note
  useEffect(() => {
    if (!currentNote?.reminder) {
      setReminderDate('');
      setReminderTime('');
    } else {
      const d = new Date(currentNote.reminder);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setReminderDate(`${yyyy}-${mm}-${dd}`);
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        setReminderTime(`${hh}:${mi}`);
      } else {
        setReminderDate('');
        setReminderTime('');
      }
    }
  }, [currentNote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync inputs when current note changes
  useEffect(() => {
    setTitle(currentNote?.title || '');
    setContent(currentNote?.content || '');
    setTagsLocal(currentNote?.tags || []);
    setSavedAt(null);
    setTagInput('');
  }, [currentNote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save after small debounce for title/content
  useEffect(() => {
    if (!selectedId) return;
    if (!currentNote) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      const needsUpdate =
        title !== currentNote.title ||
        content !== currentNote.content;
      if (needsUpdate) {
        actions.updateNote(selectedId, { title, content });
        setSavedAt(Date.now());
      }
    }, 400);

    return () => clearTimeout(saveTimeout.current);
  }, [title, content, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildReminderIso = () => {
    if (!reminderDate) return null;
    if (reminderTime) return `${reminderDate}T${reminderTime}`;
    // If no time provided, set to 09:00 local by default
    return `${reminderDate}T09:00`;
  };

  const handleReminderChange = () => {
    if (!selectedId) return;
    const iso = buildReminderIso();
    actions.setReminder(selectedId, iso);
    setSavedAt(Date.now());
  };

  const clearReminder = () => {
    setReminderDate('');
    setReminderTime('');
    if (selectedId) {
      actions.setReminder(selectedId, null);
      setSavedAt(Date.now());
    }
  };

  const onAddTag = () => {
    const t = (tagInput || '').trim().toLowerCase();
    if (!t) return;
    if (tagsLocal.includes(t)) {
      setTagInput('');
      return;
    }
    const next = [...tagsLocal, t];
    setTagsLocal(next);
    if (selectedId) actions.setTags(selectedId, next);
    setTagInput('');
    setSavedAt(Date.now());
  };

  const onRemoveTag = (t) => {
    const next = tagsLocal.filter(x => x !== t);
    setTagsLocal(next);
    if (selectedId) actions.setTags(selectedId, next);
    setSavedAt(Date.now());
  };

  const onTagInputKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      onAddTag();
    }
    if (e.key === 'Backspace' && !tagInput && tagsLocal.length) {
      // quick remove last tag
      onRemoveTag(tagsLocal[tagsLocal.length - 1]);
    }
  };

  const renderReminderStatus = () => {
    const iso = currentNote?.reminder;
    if (!iso) return 'No reminder set';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Invalid reminder';
    const now = Date.now();
    const when = d.getTime();
    const overdue = when < now;
    const soon = !overdue && when - now <= 24 * 60 * 60 * 1000;
    return `${overdue ? 'Overdue: ' : soon ? 'Due soon: ' : 'Reminder: '} ${d.toLocaleString()}`;
  };

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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{renderReminderStatus()}</span>
        </div>
      </div>
      <div className="editor">
        <input
          className="input-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          aria-label="Note title"
        />

        {/* Tags editor */}
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tagsLocal.map(t => (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  padding: '3px 8px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--muted-bg)',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
                title={`Tag: ${t}`}
              >
                #{t}
                <button
                  className="btn"
                  onClick={() => onRemoveTag(t)}
                  aria-label={`Remove tag ${t}`}
                  style={{ padding: '2px 6px', fontSize: 11 }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="input-title"
              placeholder="Add a tag and press Enter"
              aria-label="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagInputKey}
              style={{ maxWidth: 260, padding: '8px 10px', fontSize: 14 }}
            />
            <button className="btn" onClick={onAddTag} aria-label="Add tag">Add</button>
          </div>
        </div>

        {/* Reminder controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Reminder:</label>
          <input
            type="date"
            value={reminderDate}
            onChange={(e) => { setReminderDate(e.target.value); }}
            onBlur={handleReminderChange}
            aria-label="Reminder date"
            className="input-title"
            style={{ maxWidth: 180, padding: '8px 10px', fontSize: 14 }}
          />
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => { setReminderTime(e.target.value); }}
            onBlur={handleReminderChange}
            aria-label="Reminder time"
            className="input-title"
            style={{ maxWidth: 120, padding: '8px 10px', fontSize: 14 }}
          />
          <button className="btn" onClick={clearReminder} aria-label="Clear reminder">Clear</button>
        </div>

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
