import React, { useMemo } from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * PUBLIC_INTERFACE
 * DailyAgenda shows:
 * - Today's reminders
 * - Notes updated today
 * - Overdue reminders
 * Items click through to open the note in the editor.
 */
export default function DailyAgenda() {
  const { notes, agenda, actions } = useNotes();

  const { todayReminders, overdueReminders, todayNotes } = agenda;

  const hasAny =
    (todayReminders?.length || 0) > 0 ||
    (overdueReminders?.length || 0) > 0 ||
    (todayNotes?.length || 0) > 0;

  const sectionHeader = (title, count) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-surface)'
    }}>
      <strong style={{ fontSize: 13 }}>{title}</strong>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{count}</span>
    </div>
  );

  const Card = ({ icon, title, sub, onClick, tone = 'default' }) => {
    const toneStyle =
      tone === 'danger'
        ? { borderColor: '#fecaca', background: '#fff1f2' }
        : tone === 'warning'
          ? { borderColor: '#fed7aa', background: '#fff7ed' }
          : {};
    return (
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
        className="agenda-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid var(--border)',
          borderRadius: 10,
          background: '#fff',
          padding: '10px 12px',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
          transition: 'transform .04s ease, box-shadow .2s ease, border-color .2s ease',
          ...toneStyle
        }}
      >
        <div style={{ fontSize: 16 }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title || 'Untitled'}
          </div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>}
        </div>
      </div>
    );
  };

  const onOpen = (id) => actions.selectNote(id);

  const todayLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }, []);

  return (
    <div className="calendar-root" aria-label="Daily agenda" style={{ background: '#fff', gridTemplateRows: 'auto 1fr' }}>
      <div className="calendar-toolbar">
        <div className="calendar-month"><strong>Today</strong> — {todayLabel}</div>
        <div className="calendar-tools">
          <button className="btn" onClick={() => actions.createNote()} aria-label="Create a new note">New note</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12, height: 'calc(100vh - 56px - 48px)', overflow: 'auto', background: 'var(--bg-editor)' }}>
        <section style={{ display: 'grid', gridTemplateRows: 'auto 1fr', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', minHeight: 0 }}>
          {sectionHeader('Overdue', overdueReminders.length)}
          <div style={{ padding: 10, display: 'grid', gap: 8, overflowY: 'auto' }}>
            {overdueReminders.length === 0 && <div className="kanban-empty">Nothing overdue 🎉</div>}
            {overdueReminders.map(it => (
              <Card
                key={`od-${it.id}`}
                icon="⏰"
                title={it.title}
                sub={`Was due ${it.when.toLocaleString()}`}
                onClick={() => onOpen(it.id)}
                tone="danger"
              />
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateRows: 'auto 1fr', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', minHeight: 0 }}>
          {sectionHeader('Today\'s Reminders', todayReminders.length)}
          <div style={{ padding: 10, display: 'grid', gap: 8, overflowY: 'auto' }}>
            {todayReminders.length === 0 && <div className="kanban-empty">No reminders for today</div>}
            {todayReminders.map(it => (
              <Card
                key={`tr-${it.id}`}
                icon="⏰"
                title={it.title}
                sub={`Today at ${it.when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                onClick={() => onOpen(it.id)}
                tone={it.soon ? 'warning' : 'default'}
              />
            ))}
          </div>
        </section>

        <section style={{ gridColumn: '1 / span 2', display: 'grid', gridTemplateRows: 'auto 1fr', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', minHeight: 0 }}>
          {sectionHeader('Notes touched today', todayNotes.length)}
          <div style={{ padding: 10, display: 'grid', gap: 8, overflowY: 'auto' }}>
            {todayNotes.length === 0 && <div className="kanban-empty">No notes updated today</div>}
            {todayNotes.map(n => (
              <Card
                key={`tn-${n.id}`}
                icon="📝"
                title={n.title || 'Untitled note'}
                sub={`Updated ${new Date(n.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                onClick={() => onOpen(n.id)}
              />
            ))}
          </div>
        </section>

        {!hasAny && (
          <div className="empty-card" style={{ gridColumn: '1 / span 2' }}>
            <h3>Nothing for today</h3>
            <p>Create a note or set a reminder to see it here.</p>
            <button className="btn btn-primary" onClick={() => actions.createNote()}>New note</button>
          </div>
        )}
      </div>
    </div>
  );
}
