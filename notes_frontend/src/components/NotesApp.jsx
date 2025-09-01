import React from 'react';
import { NotesProvider } from '../context/NotesContext';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import EditorPane from './EditorPane';

/**
 * PUBLIC_INTERFACE
 * High-level app layout with top bar, sidebar, and editor pane.
 */
export default function NotesApp() {
  return (
    <NotesProvider>
      <div className="app-shell">
        <Topbar />
        <div className="content">
          <Sidebar />
          <EditorPane />
        </div>
      </div>
    </NotesProvider>
  );
}
