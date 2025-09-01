import React, { useMemo, useState } from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * PUBLIC_INTERFACE
 * KanbanView renders notes grouped by status with drag-and-drop to reorder across columns.
 * Supported statuses: 'todo' | 'inprogress' | 'done' (extensible).
 * Dragging a card and dropping into a column updates the note.status via context actions.
 */
export default function KanbanView() {
  const { notes, actions } = useNotes();
  const [draggingId, setDraggingId] = useState(null);

  // Ensure every note has a status for display (default to 'todo' if missing)
  const normalizedNotes = useMemo(() => {
    return notes.map(n => ({ ...n, status: n.status || 'todo' }));
  }, [notes]);

  const columns = [
    { key: 'todo', label: 'Todo', icon: '📝' },
    { key: 'inprogress', label: 'In Progress', icon: '⚙️' },
    { key: 'done', label: 'Done', icon: '✅' },
  ];

  const byStatus = useMemo(() => {
    const map = { todo: [], inprogress: [], done: [] };
    normalizedNotes.forEach(n => {
      const k = ['todo', 'inprogress', 'done'].includes(n.status) ? n.status : 'todo';
      map[k].push(n);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => b.updatedAt - a.updatedAt));
    return map;
  }, [normalizedNotes]);

  const onDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDropTo = (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (!id) return;
    actions.updateNote(id, { status });
    setDraggingId(null);
  };

  const onCardClick = (id) => {
    actions.selectNote(id);
  };

  return (
    <div className="kanban-root" aria-label="Kanban board">
      {columns.map(col => (
        <section
          key={col.key}
          className="kanban-column"
          onDragOver={onDragOver}
          onDrop={(e) => onDropTo(e, col.key)}
          aria-label={`${col.label} column`}
        >
          <header className="kanban-col-header">
            <span aria-hidden="true">{col.icon}</span>
            <strong>{col.label}</strong>
            <span className="kanban-count">{byStatus[col.key].length}</span>
          </header>
          <div className="kanban-col-body">
            {byStatus[col.key].length === 0 && (
              <div className="kanban-empty">Drop notes here</div>
            )}
            {byStatus[col.key].map(card => {
              const updated = new Date(card.updatedAt).toLocaleString();
              const hasReminder = !!card.reminder;
              return (
                <div
                  key={card.id}
                  className={`kanban-card ${draggingId === card.id ? 'is-dragging' : ''}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, card.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => onCardClick(card.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onCardClick(card.id); }}
                  title="Drag to move between columns"
                >
                  <div className="kc-title">
                    {card.title || 'Untitled note'}
                    {hasReminder && <span className="kc-tag kc-reminder">⏰</span>}
                  </div>
                  <div className="kc-snippet">{(card.content || '').replace(/\n+/g, ' ').slice(0, 120) || 'No content yet.'}</div>
                  <div className="kc-meta">{updated}</div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
