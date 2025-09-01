//
// PUBLIC_INTERFACE
// Predefined note templates for quick creation. Each template provides a title generator
// and default content skeleton. Extend this list to add new templates.
//
export const NoteTemplates = [
  {
    key: 'blank',
    name: 'Blank',
    emoji: '📝',
    description: 'Start from scratch.',
    buildTitle: () => 'Untitled note',
    buildContent: () => '',
  },
  {
    key: 'meeting',
    name: 'Meeting Notes',
    emoji: '📒',
    description: 'Agenda, attendees, decisions, and action items.',
    buildTitle: () => {
      const d = new Date();
      const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      return `Meeting Notes — ${date}`;
    },
    buildContent: () => [
      '# Meeting Notes',
      '',
      'Date: ',
      'Attendees: ',
      '',
      '## Agenda',
      '- ',
      '- ',
      '- ',
      '',
      '## Discussion',
      '- ',
      '- ',
      '',
      '## Decisions',
      '- ',
      '',
      '## Action Items',
      '- [ ] Owner — Task (due: )',
      '- [ ] Owner — Task (due: )',
      '',
    ].join('\n'),
  },
  {
    key: 'daily_journal',
    name: 'Daily Journal',
    emoji: '📓',
    description: 'Reflect on your day with prompts.',
    buildTitle: () => {
      const d = new Date();
      const date = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return `Journal — ${date}`;
    },
    buildContent: () => [
      '# Daily Journal',
      '',
      '## Gratitude',
      '- ',
      '- ',
      '- ',
      '',
      '## Highlights',
      '- ',
      '- ',
      '',
      '## Challenges',
      '- ',
      '',
      '## What I learned',
      '- ',
      '',
      '## Tomorrow',
      '- ',
      '',
    ].join('\n'),
  },
  {
    key: 'todo',
    name: 'To-do List',
    emoji: '✅',
    description: 'Simple list of tasks.',
    buildTitle: () => 'To-do',
    buildContent: () => [
      '# To-do',
      '',
      '- [ ] ',
      '- [ ] ',
      '- [ ] ',
      '',
      '## Notes',
      '- ',
      '',
    ].join('\n'),
  },
  {
    key: 'project_brief',
    name: 'Project Brief',
    emoji: '🗂️',
    description: 'Objectives, scope, milestones, and risks.',
    buildTitle: () => 'Project Brief',
    buildContent: () => [
      '# Project Brief',
      '',
      '## Overview',
      '',
      '## Objectives',
      '- ',
      '- ',
      '',
      '## Scope',
      '- In Scope:',
      '  - ',
      '- Out of Scope:',
      '  - ',
      '',
      '## Milestones',
      '- ',
      '- ',
      '',
      '## Risks & Mitigations',
      '- Risk: ',
      '  - Mitigation: ',
      '',
      '## Stakeholders',
      '- ',
      '',
    ].join('\n'),
  },
];

//
// PUBLIC_INTERFACE
// Get a template by key. Falls back to 'blank'.
//
export function getTemplateByKey(key) {
  const found = NoteTemplates.find(t => t.key === key);
  if (found) return found;
  return NoteTemplates.find(t => t.key === 'blank');
}

//
// PUBLIC_INTERFACE
// Build a new note draft object from a template key.
//
export function buildNoteFromTemplate(templateKey) {
  const t = getTemplateByKey(templateKey);
  return {
    title: t.buildTitle(),
    content: t.buildContent(),
  };
}
