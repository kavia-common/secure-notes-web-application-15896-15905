const STORAGE_KEY = 'notes_app_items_v1';

/**
 * PUBLIC_INTERFACE
 * Simple localStorage-backed persistence for notes.
 * Includes:
 * - reminder: string | null (ISO datetime string: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm')
 * - status: 'todo' | 'inprogress' | 'done'
 * - tags: string[] (lowercased, unique per note)
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
        .map(n => {
          const tags = Array.isArray(n.tags)
            ? [...new Set(n.tags.map(t => String(t || '').trim().toLowerCase()))].filter(Boolean)
            : [];
          return {
            id: n.id,
            title: String(n.title || 'Untitled note'),
            content: String(n.content || ''),
            updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : Date.now(),
            // reminder persisted as ISO string or null when absent
            reminder: typeof n.reminder === 'string' ? n.reminder : null,
            // kanban status with fallback to 'todo'
            status: typeof n.status === 'string' ? n.status : 'todo',
            // tags array normalized
            tags,
          };
        });
    } catch {
      return [];
    }
  },

  /** Save notes array to storage. */
  save(notes) {
    try {
      const sanitized = (notes || []).map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        updatedAt: n.updatedAt,
        reminder: n.reminder ?? null,
        status: n.status ?? 'todo',
        tags: Array.isArray(n.tags) ? n.tags : [],
      }));
      const data = JSON.stringify(sanitized);
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
