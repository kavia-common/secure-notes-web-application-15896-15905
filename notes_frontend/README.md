# Notes Frontend (React)

Minimalistic, responsive notes UI with light theme and a clean layout.

## Features
- Create, edit, and delete notes
- List and search notes
- Responsive layout: top bar, sidebar (navigation + search), main pane (editor)
- Light theme with palette (Black & White):
  - Primary: `#000000`
  - Accent: `#000000`
  - Secondary: `#ffffff`
- LocalStorage persistence (no backend required)

## Quick Start
- Install: `npm install`
- Run: `npm start`
- Test: `npm test`
- Build: `npm run build`

## Structure
- `src/components/`:
  - `NotesApp.jsx` — main layout
  - `Topbar.jsx` — brand + actions
  - `Sidebar.jsx` — search + notes list
  - `EditorPane.jsx` — title + body editor with autosave
- `src/context/NotesContext.js` — notes state, CRUD actions, search, selection
- `src/services/storage.js` — localStorage persistence
- `src/App.css` — all UI styles and theme variables

## Notes
- All data is stored locally in the browser under key `notes_app_items_v1`.
- This frontend is decoupled from backend services; integrate API calls by replacing storage with remote persistence inside `NotesContext`/`storage.js`.
