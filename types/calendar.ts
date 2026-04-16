export type ViewMode = 'month' | 'week' | 'day'

export type Priority = 'low' | 'medium' | 'high'

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  all_day: boolean
  color: string
  priority: Priority
  location: string | null
  created_at: string
  updated_at: string
}

export interface CreateEventInput {
  title: string
  start_time: string
  end_time: string
  all_day?: boolean
  description?: string
  location?: string
  color?: string
  priority?: Priority
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string
}

export interface ModalState {
  open: boolean
  mode: 'create' | 'edit'
  event?: CalendarEvent
  defaultDate?: Date
}
