import React, { useMemo, useState } from 'react';
import { useNotes } from '../context/NotesContext';
import { NoteTemplates } from '../services/templates';

/**
 * PUBLIC_INTERFACE
 * Sidebar for search, tag filters, and note navigation.
 */
function TemplatePickerButton({ onPick = () => {} }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-primary"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Create new note"
        title="Create new note"
      >
        New note ▾
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Note templates"
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 6px)',
            minWidth: 260,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-md)',
            padding: 6,
            zIndex: 10,
            display: 'grid',
            gap: 4,
          }}
        >
          {NoteTemplates.map(t => (
            <button
              key={t.key}
              role="menuitem"
              className="btn"
              onClick={() => { onPick(t.key); setOpen(false); }}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr',
                alignItems: 'start',
                gap: 8,
                textAlign: 'left',
                background: '#fff',
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
  );
}

export default function Sidebar() {
  const { filteredNotes, selectedId, actions, query, reminders, uniqueTags, activeTagFilters } = useNotes();

  const [showQuickReminder, setShowQuickReminder] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState('');
  const [remTime, setRemTime] = useState('');
  const [linkToCurrent, setLinkToCurrent] = useState(true);

  const badgeStyle = (overdue, soon) => {
    if (overdue) return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
    if (soon) return { background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' };
    return { background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' };
  };

  const resetQuickForm = () => {
    setRemTitle('');
    setRemDate('');
    setRemTime('');
    setLinkToCurrent(true);
  };

  const submitQuickReminder = () => {
    if (!remDate) {
      alert('Please choose a date for the reminder.');
      return;
    }
    const payload = {
      date: remDate,
      time: remTime,
      title: remTitle,
      linkToNoteId: linkToCurrent ? selectedId : null,
    };
    const createdId = actions.createReminder(payload);
    if (createdId) {
      // Select the note associated with the reminder
      actions.selectNote(createdId);
    }
    resetQuickForm();
    setShowQuickReminder(false);
  };

  // Render text with highlighted ranges.
  const Highlighted = ({ snippet }) => {
    if (!snippet || typeof snippet.text !== 'string') return null;
    const { text, ranges, prefixEllipsis, suffixEllipsis } = snippet;
    if (!ranges || ranges.length === 0) {
      return <span>{prefixEllipsis ? '…' : ''}{text}{suffixEllipsis ? '…' : ''}</span>;
    }
    const parts = [];
    let cursor = 0;
    for (const [start, end] of ranges) {
      if (cursor < start) {
        parts.push(<span key={`t-${cursor}-${start}`}>{text.slice(cursor, start)}</span>);
      }
      parts.push(
        <mark key={`m-${start}-${end}`} style={{ background: 'rgba(255,204,0,0.4)', padding: 0 }}>
          {text.slice(start, end)}
        </mark>
      );
      cursor = end;
    }
    if (cursor < text.length) {
      parts.push(<span key={`t-end-${cursor}`}>{text.slice(cursor)}</span>);
    }
    return <span>{prefixEllipsis ? '…' : ''}{parts}{suffixEllipsis ? '…' : ''}</span>;
  };

  const hasQuery = (query || '').trim().length > 0;

  // Derived: tags summary string
  const activeTagsLabel = useMemo(() => {
    if (!activeTagFilters.length) return 'All';
    return activeTagFilters.map(t => `#${t}`).join(', ');
  }, [activeTagFilters]);

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
        <div style={{ display: 'flex', gap: 8, marginTop: 8, position: 'relative' }}>
          <TemplatePickerButton onPick={(k) => {
            if (k === 'blank') actions.createNote();
            else actions.createNoteFromTemplate?.(k);
          }} />
          <button
            className="btn"
            onClick={() => setShowQuickReminder((v) => !v)}
            aria-label="Create new reminder"
            title="Create a new reminder"
          >
            New reminder
          </button>
        </div>
        {showQuickReminder && (
          <div
            aria-label="Quick reminder"
            style={{
              marginTop: 10,
              padding: 10,
              border: '1px solid var(--border)',
              borderRadius: 10,
              background: '#fff',
              boxShadow: 'var(--shadow-sm)',
              display: 'grid',
              gap: 8
            }}
          >
            <input
              className="input-title"
              placeholder="Reminder title (optional)"
              aria-label="Reminder title"
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
              style={{ fontSize: 14, padding: '8px 10px' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="date"
                className="input-title"
                aria-label="Reminder date"
                value={remDate}
                onChange={(e) => setRemDate(e.target.value)}
                style={{ maxWidth: 180, padding: '8px 10px', fontSize: 14 }}
              />
              <input
                type="time"
                className="input-title"
                aria-label="Reminder time"
                value={remTime}
                onChange={(e) => setRemTime(e.target.value)}
                style={{ maxWidth: 120, padding: '8px 10px', fontSize: 14 }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={!!selectedId && linkToCurrent}
                onChange={(e) => setLinkToCurrent(e.target.checked)}
                disabled={!selectedId}
              />
              Link to selected note{!selectedId ? ' (select a note to enable)' : ''}
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => { resetQuickForm(); setShowQuickReminder(false); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitQuickReminder}>
                Save reminder
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tag chips filter */}
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tags</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{activeTagsLabel}</span>
            <button
              className="btn"
              onClick={actions.clearTagFilters}
              disabled={activeTagFilters.length === 0}
              style={{ opacity: activeTagFilters.length ? 1 : 0.5 }}
              aria-label="Clear tag filters"
            >
              Clear
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {uniqueTags.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No tags yet</span>
          )}
          {uniqueTags.map(tag => {
            const isActive = activeTagFilters.includes(tag);
            return (
              <button
                key={tag}
                className="btn"
                onClick={() => actions.toggleTagFilter(tag)}
                aria-pressed={isActive}
                title={`Filter by #${tag}`}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  borderRadius: 999,
                  background: isActive ? 'var(--color-primary)' : '#fff',
                  borderColor: isActive ? 'var(--color-primary)' : 'var(--border)',
                  color: isActive ? '#fff' : 'var(--text-primary)'
                }}
              >
                #{tag}
              </button>
            );
          })}
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
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <TemplatePickerButton onPick={(k) => {
                if (k === 'blank') actions.createNote();
                else actions.createNoteFromTemplate?.(k);
              }} />
            </div>
          </div>
        )}
        {filteredNotes.map(note => {
          const isActive = note.id === selectedId;
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

          // When searching, show contextual highlights; otherwise the classic snippet
          const showHighlights = hasQuery && note._snippets;
          const titleSnippet = showHighlights && note._snippets.title;
          const contentSnippet = showHighlights && note._snippets.content;
          const reminderSnippet = showHighlights && note._snippets.reminder;

          const defaultSnippet = (note.content || '').replace(/\n+/g, ' ').slice(0, 80) || 'No content yet.';

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
              <div className="note-title" title={note.title || 'Untitled note'}>
                {titleSnippet ? <Highlighted snippet={titleSnippet} /> : (note.title || 'Untitled note')} {chip}
              </div>

              {/* tags display */}
              {!!(note.tags && note.tags.length) && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '4px 0' }}>
                  {note.tags.map(t => (
                    <span
                      key={`${note.id}-${t}`}
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        background: '#eef2ff',
                        color: '#3730a3'
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="note-snippet">
                {contentSnippet ? (
                  <span><Highlighted snippet={contentSnippet} /></span>
                ) : (
                  defaultSnippet
                )}
              </div>

              {reminderSnippet && (
                <div className="note-snippet" style={{ fontSize: 11 }}>
                  ⏰ <Highlighted snippet={reminderSnippet} />
                </div>
              )}

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
