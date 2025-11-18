import { AppState, Goal, TaskStatus, WeekData, Tactic } from '../types';

const STORAGE_KEY = '12wy_pvs_data_v1';

const INITIAL_STATE: AppState = {
  vision: '',
  goals: [],
  currentWeek: 1,
  weeks: [],
  isCalendarConnected: false,
  connectedEmail: null,
  startDate: new Date().toISOString(),
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return INITIAL_STATE;
    return JSON.parse(serialized);
  } catch (e) {
    console.error("Failed to load state", e);
    return INITIAL_STATE;
  }
};

export const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

// Helper to generate ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const initializeWeek = (weekNum: number, goals: Goal[]): WeekData => {
  // Flatten tactics from all goals for the week
  const tacticsSnapshot: Tactic[] = goals.flatMap(g => 
    g.tactics.map(t => ({...t, status: TaskStatus.PENDING}))
  );

  return {
    weekNumber: weekNum,
    startDate: new Date().toISOString(), // Simplified for demo
    tacticsSnapshot,
    executionScore: 0,
    reflection: '',
    isReviewed: false
  };
};