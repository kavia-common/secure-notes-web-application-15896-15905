import React, { useState } from 'react';
import { NotesProvider } from '../context/NotesContext';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import EditorPane from './EditorPane';
import CalendarView from './CalendarView';
import KanbanView from './KanbanView';
import DailyAgenda from './DailyAgenda';

/**
 * PUBLIC_INTERFACE
 * High-level app layout with top bar, sidebar, and editor pane.
 * Adds a Calendar view that can be toggled from the Topbar.
 */
export default function NotesApp() {
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'calendar' | 'kanban' | 'agenda'

  return (
    <NotesProvider>
      <div className="app-shell">
        <Topbar viewMode={viewMode} onChangeView={setViewMode} />
        {viewMode === 'calendar' ? (
          <div className="content" style={{ gridTemplateColumns: '1fr' }}>
            <CalendarView />
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="content" style={{ gridTemplateColumns: '1fr' }}>
            <KanbanView />
          </div>
        ) : viewMode === 'agenda' ? (
          <div className="content" style={{ gridTemplateColumns: '1fr' }}>
            <DailyAgenda />
          </div>
        ) : (
          <div className="content">
            <Sidebar />
            <EditorPane />
          </div>
        )}
      </div>
    </NotesProvider>
  );
}
