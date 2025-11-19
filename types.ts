export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED'
}

export interface Tactic {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number; // For calendar blocking
  status: TaskStatus;
  linkedGoalId: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  tactics: Tactic[];
  progress: number; // 0-100
}

export interface WeekData {
  weekNumber: number;
  startDate: string;
  tacticsSnapshot: Tactic[]; // Tactics active for this week
  executionScore: number; // Calculated percentage
  reflection: string;
  isReviewed: boolean;
}

export interface AppState {
  vision: string;
  goals: Goal[];
  currentWeek: number;
  weeks: WeekData[]; // History and current week data
  isCalendarConnected: boolean;
  connectedEmail?: string | null; // The email of the connected Google account
  startDate: string; // The start of the 12 week cycle
  // User provided credentials
  googleClientId?: string;
  googleApiKey?: string;
}

export interface CalendarEventConfig {
  summary: string;
  description: string;
  startDateTime: string; // ISO String
  endDateTime: string; // ISO String
  colorId?: string; // '11' is usually red (Strategy Time)
}