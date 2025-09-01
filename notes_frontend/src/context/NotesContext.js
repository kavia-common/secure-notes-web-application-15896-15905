import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../services/storage';

/**
 * Note shape used in the app.
 * id: string, title: string, content: string, updatedAt: number, reminder?: string|null (ISO)
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
    const q = query.trim().toLowerCase();
    const base = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return base;
    return base.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    );
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

  const value = {
    notes,
    filteredNotes,
    currentNote,
    selectedId,
    query,
    reminders,
    actions: { createNote, updateNote, deleteNote, selectNote, setQuery, setReminder, createReminder },
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
