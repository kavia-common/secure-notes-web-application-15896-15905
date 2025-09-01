import React, { useMemo, useState } from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * PUBLIC_INTERFACE
 * Calendar view component that displays a monthly calendar with notes and reminders
 * grouped by date. Users can navigate months, select a date, and click items to
 * open the related note in the editor.
 */
export default function CalendarView() {
  const { notes, actions } = useNotes();

  // track visible month/year and selected date
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() }; // month: 0-11
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return toYMD(d);
  });

  // Build a map of date (YYYY-MM-DD) -> array of items (notes + reminders on that date)
  const itemsByDate = useMemo(() => {
    const map = new Map();
    const push = (key, item) => {
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    };

    notes.forEach(n => {
      // Any note has an updated date - include it for "notes by date" (optional)
      // Here we include both updatedAt day and reminder day (if any).
      const updated = new Date(n.updatedAt);
      if (!isNaN(updated.getTime())) {
        push(toYMD(updated), { kind: 'note', id: n.id, title: n.title || 'Untitled note', time: null });
      }
      if (n.reminder) {
        const rd = new Date(n.reminder);
        if (!isNaN(rd.getTime())) {
          const time = rd.toTimeString().slice(0, 5);
          push(toYMD(rd), {
            kind: 'reminder',
            id: n.id,
            title: n.title || 'Reminder',
            time
          });
        }
      }
    });

    // Sort each day's items: reminders (by time) first, then notes
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'reminder' ? -1 : 1;
        if (a.kind === 'reminder' && b.kind === 'reminder') return (a.time || '').localeCompare(b.time || '');
        return 0;
      });
      map.set(key, list);
    }
    return map;
  }, [notes]);

  // Build the days grid for the current month
  const grid = useMemo(() => {
    const firstOfMonth = new Date(cursor.year, cursor.month, 1);
    const startWeekday = firstOfMonth.getDay(); // 0=Sun..6=Sat
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

    // We will render a 6x7 grid (6 weeks) starting from the Sunday before the 1st
    const startDate = new Date(cursor.year, cursor.month, 1 - startWeekday);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = toYMD(d);
      const inCurrentMonth = d.getMonth() === cursor.month;
      const dayItems = itemsByDate.get(key) || [];
      cells.push({ date: d, key, inCurrentMonth, items: dayItems });
    }
    return cells;
  }, [cursor, itemsByDate]);

  const todayYMD = toYMD(new Date());

  const gotoPrevMonth = () => {
    setCursor(prev => {
      const m = prev.month - 1;
      if (m < 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: m };
    });
  };

  const gotoNextMonth = () => {
    setCursor(prev => {
      const m = prev.month + 1;
      if (m > 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: m };
    });
  };

  const gotoToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(toYMD(d));
  };

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const onDayClick = (dKey) => {
    setSelectedDate(dKey);
  };

  const onItemClick = (id) => {
    actions.selectNote(id);
  };

  // Build list for the selected date
  const selectedItems = itemsByDate.get(selectedDate) || [];

  return (
    <div className="calendar-root" aria-label="Calendar view">
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button className="btn" onClick={gotoPrevMonth} aria-label="Previous month">◀</button>
          <div className="calendar-month">{monthLabel}</div>
          <button className="btn" onClick={gotoNextMonth} aria-label="Next month">▶</button>
        </div>
        <div className="calendar-tools">
          <button className="btn" onClick={gotoToday} aria-label="Go to today">Today</button>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label="Month grid">
        <div className="calendar-weekday">Sun</div>
        <div className="calendar-weekday">Mon</div>
        <div className="calendar-weekday">Tue</div>
        <div className="calendar-weekday">Wed</div>
        <div className="calendar-weekday">Thu</div>
        <div className="calendar-weekday">Fri</div>
        <div className="calendar-weekday">Sat</div>

        {grid.map(cell => {
          const isToday = cell.key === todayYMD;
          const isSelected = cell.key === selectedDate;
          return (
            <div
              key={cell.key}
              className={[
                'calendar-cell',
                cell.inCurrentMonth ? 'in-month' : 'out-month',
                isToday ? 'is-today' : '',
                isSelected ? 'is-selected' : ''
              ].join(' ')}
              role="gridcell"
              aria-selected={isSelected}
              onClick={() => onDayClick(cell.key)}
            >
              <div className="calendar-date-label">{cell.date.getDate()}</div>
              <div className="calendar-items">
                {cell.items.slice(0, 3).map((it, idx) => (
                  <div
                    key={idx}
                    className={`calendar-chip ${it.kind === 'reminder' ? 'chip-reminder' : 'chip-note'}`}
                    onClick={(e) => { e.stopPropagation(); onItemClick(it.id); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onItemClick(it.id); }}
                    title={it.title + (it.time ? ` • ${it.time}` : '')}
                  >
                    {it.kind === 'reminder' ? '⏰' : '📝'} {it.time ? `${it.time} ` : ''}{truncate(it.title, 18)}
                  </div>
                ))}
                {cell.items.length > 3 && (
                  <div className="calendar-more">+{cell.items.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="calendar-selected-panel" aria-live="polite">
        <div className="calendar-selected-header">
          <strong>{formatYMDReadable(selectedDate)}</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}> — {selectedItems.length} item(s)</span>
        </div>
        <div className="calendar-selected-list">
          {selectedItems.length === 0 && (
            <div className="empty-card">
              <h3>No items</h3>
              <p>No notes or reminders on this date.</p>
            </div>
          )}
          {selectedItems.map((it, idx) => (
            <div
              key={`${it.id}-${idx}`}
              className="calendar-selected-item"
              onClick={() => onItemClick(it.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onItemClick(it.id); }}
            >
              <div className="csi-icon">{it.kind === 'reminder' ? '⏰' : '📝'}</div>
              <div className="csi-body">
                <div className="csi-title">{it.title}</div>
                <div className="csi-sub">{it.kind === 'reminder' ? (it.time ? `Reminder at ${it.time}` : 'Reminder') : 'Note updated this day'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function toYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatYMDReadable(ymd) {
  // ymd format expected YYYY-MM-DD
  const [y, m, d] = (ymd || '').split('-').map(Number);
  if (!y || !m || !d) return 'Invalid date';
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
}

function truncate(s, n) {
  const str = String(s || '');
  if (str.length <= n) return str;
  return str.slice(0, n - 1) + '…';
}
