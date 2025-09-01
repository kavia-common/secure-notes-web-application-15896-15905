import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../services/storage';

/**
 * Note shape used in the app.
 * id: string, title: string, content: string, updatedAt: number
 */
const NotesContext = createContext(null);

/**
 * Generate a simple unique id. For production, swap with uuid.
 */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/**
 * PUBLIC_INTERFACE
 * Provides notes state and actions for the app (CRUD, selection, search).
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

  const value = {
    notes,
    filteredNotes,
    currentNote,
    selectedId,
    query,
    actions: { createNote, updateNote, deleteNote, selectNote, setQuery },
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
