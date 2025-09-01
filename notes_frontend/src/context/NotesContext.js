import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../services/storage';

/**
 * Note shape used in the app.
 * id: string, title: string, content: string, updatedAt: number, reminder?: string|null (ISO), status?: 'todo'|'inprogress'|'done'
 */
const NotesContext = createContext(null);

/**
 * Generate a simple unique id. For production, swap with uuid.
 */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Utility: parse reminder ISO into Date or null */
const parseReminderDate = (iso) => {
  if (!iso || typeof iso !== 'string') return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * PUBLIC_INTERFACE
 * Provides notes state and actions for the app (CRUD, selection, search, reminders).
 */
export function NotesProvider({ children }) {
  const [notes, setNotes] = useState(() => storage.load() || []);
  const [selectedId, setSelectedId] = useState(() => (notes[0]?.id || null));
  const [query, setQuery] = useState('');

  // Persist to localStorage on change
  useEffect(() => {
    storage.save(notes);
  }, [notes]);

  // Computed: filtered and sorted list
  const filteredNotes = useMemo(() => {
    /**
     * Build a searchable and highlightable list of notes.
     * - Filters by query across title, content, and reminder date string.
     * - Adds highlight ranges and snippet text for UI to render.
     */
    const qRaw = query || '';
    const q = qRaw.trim();
    const base = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) {
      // Map to same shape without highlights/snippets
      return base.map(n => ({
        ...n,
        _match: null,
        _snippets: null,
      }));
    }

    // Utility: safe lowercasing
    const safeLower = (s) => (s || '').toString().toLowerCase();
    const qLower = q.toLowerCase();

    // Utility: find all match ranges within a string (case-insensitive)
    const findRanges = (text, needle) => {
      const ranges = [];
      if (!needle) return ranges;
      const t = (text || '').toString();
      const tl = t.toLowerCase();
      const nl = needle.toLowerCase();
      if (!nl) return ranges;
      let idx = 0;
      while (true) {
        const found = tl.indexOf(nl, idx);
        if (found === -1) break;
        ranges.push([found, found + nl.length]);
        idx = found + nl.length;
      }
      return ranges;
    };

    // Utility: build snippet around first range with some context
    const buildSnippet = (text, ranges, before = 30, after = 40) => {
      const t = (text || '').toString();
      if (!ranges || ranges.length === 0) {
        // Fallback: head of text
        const head = t.slice(0, before + after);
        return {
          text: head,
          ranges: [],
          prefixEllipsis: false,
          suffixEllipsis: t.length > head.length,
        };
      }
      const [start, end] = ranges[0];
      const s = Math.max(0, start - before);
      const e = Math.min(t.length, end + after);
      const snippetText = t.slice(s, e);
      // Shift ranges to snippet-local coordinates
      const shifted = ranges
        .map(([a, b]) => {
          if (b <= s || a >= e) return null;
          return [Math.max(0, a - s), Math.min(e - s, b - s)];
        })
        .filter(Boolean);
      return {
        text: snippetText,
        ranges: shifted,
        prefixEllipsis: s > 0,
        suffixEllipsis: e < t.length,
      };
    };

    // Utility: renderable reminder string
    const reminderToString = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      return d.toLocaleString();
    };

    const results = [];
    for (const n of base) {
      const title = n.title || '';
      const content = n.content || '';
      const reminderText = reminderToString(n.reminder);

      const titleRanges = findRanges(title, qLower);
      const contentRanges = findRanges(content, qLower);
      const reminderRanges = findRanges(reminderText, qLower);

      const hasMatch = titleRanges.length > 0 || contentRanges.length > 0 || reminderRanges.length > 0;
      if (!hasMatch) continue;

      // Build snippets for each field if matched
      const snippets = {};
      if (titleRanges.length) {
        snippets.title = buildSnippet(title, titleRanges, 0, 0); // show whole title
      }
      if (contentRanges.length) {
        snippets.content = buildSnippet(content.replace(/\n+/g, ' '), contentRanges);
      }
      if (reminderRanges.length) {
        snippets.reminder = buildSnippet(reminderText, reminderRanges, 0, 0);
      }

      results.push({
        ...n,
        _match: {
          inTitle: titleRanges.length > 0,
          inContent: contentRanges.length > 0,
          inReminder: reminderRanges.length > 0,
        },
        _snippets: snippets,
      });
    }

    // If query present, return matched results; otherwise base.
    return results;
  }, [notes, query]);

  // Current note by selection
  const currentNote = useMemo(() => {
    return notes.find(n => n.id === selectedId) || null;
  }, [notes, selectedId]);

  // PUBLIC_INTERFACE
  const createNote = () => {
    const newNote = {
      id: uid(),
      title: 'Untitled note',
      content: '',
      updatedAt: Date.now(),
      reminder: null,
      status: 'todo',
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedId(newNote.id);
    return newNote.id;
  };

  // PUBLIC_INTERFACE
  const updateNote = (id, patch) => {
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    );
  };

  // PUBLIC_INTERFACE
  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedId === id) {
      // Select next available note
      const next = notes.find(n => n.id !== id)?.id || null;
      setSelectedId(next);
    }
  };

  // PUBLIC_INTERFACE
  const selectNote = (id) => setSelectedId(id);

  // PUBLIC_INTERFACE
  const setReminder = (id, isoOrNull) => {
    updateNote(id, { reminder: isoOrNull || null });
  };

  // PUBLIC_INTERFACE
  const createReminder = ({ date, time, title, linkToNoteId = null }) => {
    /**
     * Create a reminder either by:
     * - linking to an existing note (set its reminder), or
     * - creating a lightweight "reminder note" with the provided title.
     */
    const buildIso = () => {
      if (!date) return null;
      if (time) return `${date}T${time}`;
      return `${date}T09:00`;
    };
    const iso = buildIso();
    if (!iso) return null;

    if (linkToNoteId) {
      // Attach to an existing note
      setReminder(linkToNoteId, iso);
      return linkToNoteId;
    }

    // Create a standalone reminder as a new note with minimal content
    const noteTitle = (title && title.trim()) || 'Reminder';
    const newId = uid();
    const newNote = {
      id: newId,
      title: noteTitle,
      content: '',
      updatedAt: Date.now(),
      reminder: iso,
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedId(newId);
    return newId;
  };

  // Derived: reminders list (upcoming & overdue)
  const reminders = useMemo(() => {
    const now = Date.now();
    const soonThresholdMs = 24 * 60 * 60 * 1000; // 24h
    const items = notes
      .map(n => {
        const d = parseReminderDate(n.reminder);
        if (!d) return null;
        const time = d.getTime();
        const overdue = time < now;
        const soon = !overdue && time - now <= soonThresholdMs;
        return {
          id: n.id,
          title: n.title || 'Untitled note',
          when: d,
          overdue,
          soon,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.when.getTime() - b.when.getTime());
    return items;
  }, [notes]);

  const moveNote = (id, status) => {
    updateNote(id, { status });
  };

  const value = {
    notes,
    filteredNotes,
    currentNote,
    selectedId,
    query,
    reminders,
    actions: { createNote, updateNote, deleteNote, selectNote, setQuery, setReminder, createReminder, moveNote },
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 * Hook to use notes context throughout the app.
 */
export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
