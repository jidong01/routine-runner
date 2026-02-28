export interface User {
  id: string;
  created_at: string;
  run_start_km: number;
  rest_timer_default_sec: number;
  pushup_program_level: number;
  pushup_program_start_date: string | null;
  pushup_session_days: number[];
}

export interface DailyRecord {
  id: string;
  user_id: string;
  date: string;
  dopamine_status: 'success' | 'fail' | null;
  run_target_km: number | null;
  run_actual_km: number | null;
  run_completed: boolean;
  pushup_week: number | null;
  pushup_session: number | null;
  pushup_completed: boolean;
  completed_count: number;
  created_at: string;
}

export interface PushupSetRecord {
  id: string;
  daily_record_id: string;
  set_index: number;
  target_reps: number;
  completed: boolean;
  completed_at: string | null;
}

// For the rest timer - client-side only (localStorage)
export interface RestTimerState {
  currentSetIndex: number;
  startedAt: number; // timestamp ms
  durationSec: number;
  remainingSec: number;
  isRunning: boolean;
}
