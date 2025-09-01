const STORAGE_KEY = 'notes_app_items_v1';

/**
 * PUBLIC_INTERFACE
 * Simple localStorage-backed persistence for notes.
 */
export const storage = {
  /** Load notes array from storage. */
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // basic shape validation
      return parsed
        .filter(n => n && typeof n.id === 'string')
        .map(n => ({
          id: n.id,
          title: String(n.title || 'Untitled note'),
          content: String(n.content || ''),
          updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : Date.now(),
        }));
    } catch {
      return [];
    }
  },

  /** Save notes array to storage. */
  save(notes) {
    try {
      const data = JSON.stringify(notes || []);
      window.localStorage.setItem(STORAGE_KEY, data);
      return true;
    } catch {
      return false;
    }
  },

  /** Clear all stored notes (not used by UI, useful for tests) */
  clear() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  }
};
