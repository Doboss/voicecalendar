export const calendarTools = [
  {
    name: 'createEvent',
    description: 'Create a new calendar event for the user.',
    parameters: {
      type: 'OBJECT',
      required: ['title', 'start_time', 'end_time'],
      properties: {
        title:       { type: 'STRING', description: 'Event title' },
        start_time:  { type: 'STRING', description: 'ISO 8601 datetime e.g. 2026-04-20T14:00:00' },
        end_time:    { type: 'STRING', description: 'ISO 8601 datetime' },
        all_day:     { type: 'BOOLEAN', description: 'True for all-day events' },
        description: { type: 'STRING' },
        location:    { type: 'STRING' },
        color:       { type: 'STRING', description: 'Hex color e.g. #FF5733' },
        priority:    { type: 'STRING', enum: ['low', 'medium', 'high'] },
      },
    },
  },
  {
    name: 'updateEvent',
    description: 'Update an existing calendar event by ID.',
    parameters: {
      type: 'OBJECT',
      required: ['id'],
      properties: {
        id:          { type: 'STRING', description: 'UUID of the event to update' },
        title:       { type: 'STRING' },
        start_time:  { type: 'STRING' },
        end_time:    { type: 'STRING' },
        all_day:     { type: 'BOOLEAN' },
        description: { type: 'STRING' },
        location:    { type: 'STRING' },
        color:       { type: 'STRING' },
        priority:    { type: 'STRING', enum: ['low', 'medium', 'high'] },
      },
    },
  },
  {
    name: 'deleteEvent',
    description: 'Delete a calendar event by ID. Always confirm with user first.',
    parameters: {
      type: 'OBJECT',
      required: ['id'],
      properties: {
        id: { type: 'STRING', description: 'UUID of the event to delete' },
      },
    },
  },
  {
    name: 'listEvents',
    description: 'List calendar events within a date range.',
    parameters: {
      type: 'OBJECT',
      required: ['start_date', 'end_date'],
      properties: {
        start_date: { type: 'STRING', description: 'ISO 8601 date e.g. 2026-04-01' },
        end_date:   { type: 'STRING', description: 'ISO 8601 date e.g. 2026-04-30' },
      },
    },
  },
  {
    name: 'searchEvents',
    description: 'Search calendar events by keyword in title or description.',
    parameters: {
      type: 'OBJECT',
      required: ['query'],
      properties: {
        query:      { type: 'STRING', description: 'Search keyword' },
        start_date: { type: 'STRING', description: 'Optional range start (ISO date)' },
        end_date:   { type: 'STRING', description: 'Optional range end (ISO date)' },
      },
    },
  },
]
