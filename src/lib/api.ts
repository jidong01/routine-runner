import { getSupabase } from './supabase';
import type { User, DailyRecord, PushupSetRecord, RestTimerState } from './types';

function supabase() {
  return getSupabase();
}

// ============================================================
// Constants
// ============================================================

const TIMER_STATE_KEY = 'routine_runner_timer_state';

// Pushup program: 7 levels, each level has 5 sets of target reps
// Source: standard 100-pushup-style progressive program
const PUSHUP_PROGRAM: Record<number, number[]> = {
  1: [2,  3,  2,  2,  3],
  2: [6,  6,  4,  4,  5],
  3: [10, 10, 8,  6,  7],
  4: [12, 12, 10, 10, 13],
  5: [15, 15, 13, 11, 15],
  6: [18, 18, 14, 14, 20],
  7: [21, 21, 17, 17, 25],
};

// ============================================================
// Internal helpers
// ============================================================

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

/**
 * Given a program start date and session days (ISO weekday 1=Mon..7=Sun),
 * calculate the current week number (1-based) and session number within that week.
 * Returns null values if today is not a session day.
 */
function calculatePushupWeekSession(
  startDate: string,
  sessionDays: number[],
): { week: number; session: number } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  // Get ISO weekday for today (1=Mon, 7=Sun)
  const todayIsoDay = today.getDay() === 0 ? 7 : today.getDay();

  if (!sessionDays.includes(todayIsoDay)) {
    return null;
  }

  // Count how many session-day occurrences have passed from start up to and including today
  let sessionCount = 0;
  const cursor = new Date(start);
  while (cursor <= today) {
    const cursorIsoDay = cursor.getDay() === 0 ? 7 : cursor.getDay();
    if (sessionDays.includes(cursorIsoDay)) {
      sessionCount++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const sessionsPerWeek = sessionDays.length;
  const week = Math.ceil(sessionCount / sessionsPerWeek);
  const session = ((sessionCount - 1) % sessionsPerWeek) + 1;

  return { week, session };
}

// ============================================================
// Auth / User
// ============================================================

/**
 * Get the currently authenticated user's profile from the users table.
 * The users row is auto-created by a DB trigger on auth.users insert.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user: authUser } } = await supabase().auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase()
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error || !data) return null;
  return data as User;
}

/**
 * Sign in with email magic link
 */
export async function signInWithEmail(email: string): Promise<{ error: string | null }> {
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : undefined;

  const { error } = await supabase().auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  return { error: error?.message ?? null };
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await supabase().auth.signOut();
}

/**
 * Get auth state
 */
export async function getSession() {
  return await supabase().auth.getSession();
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase().auth.onAuthStateChange(callback);
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<
    Pick<
      User,
      | 'run_start_km'
      | 'rest_timer_default_sec'
      | 'pushup_program_level'
      | 'pushup_program_start_date'
      | 'pushup_session_days'
    >
  >,
): Promise<User> {
  const { data, error } = await supabase()
    .from('users')
    .update(settings)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update user settings: ${error?.message ?? 'unknown error'}`);
  }

  return data as User;
}

// ============================================================
// Daily Records
// ============================================================

/**
 * Get the last successful run distance for a user.
 * Returns null if no successful run exists.
 */
export async function getLastSuccessfulRun(userId: string): Promise<number | null> {
  const { data, error } = await supabase()
    .from('daily_records')
    .select('run_actual_km')
    .eq('user_id', userId)
    .eq('run_completed', true)
    .not('run_actual_km', 'is', null)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.run_actual_km as number;
}

/**
 * Get or create today's daily record for the given user.
 * On creation, calculates:
 *   - run_target_km: last successful run + 0.2 km, or user's run_start_km
 *   - pushup_week / pushup_session: derived from the user's program config
 */
export async function getOrCreateTodayRecord(userId: string): Promise<DailyRecord> {
  const today = getTodayDateString();

  // Check for existing record
  const { data: existing, error: fetchError } = await supabase()
    .from('daily_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch today's record: ${fetchError.message}`);
  }

  if (existing) {
    return existing as DailyRecord;
  }

  // Fetch user settings for calculation
  const { data: user, error: userError } = await supabase()
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error(`Failed to fetch user: ${userError?.message ?? 'unknown error'}`);
  }

  // Calculate run target
  const lastRunKm = await getLastSuccessfulRun(userId);
  const runTargetKm =
    lastRunKm !== null
      ? Math.round((lastRunKm + 0.2) * 10) / 10 // round to 1 decimal
      : (user as User).run_start_km;

  // Calculate pushup week/session
  let pushupWeek: number | null = null;
  let pushupSession: number | null = null;

  if ((user as User).pushup_program_start_date) {
    const ws = calculatePushupWeekSession(
      (user as User).pushup_program_start_date!,
      (user as User).pushup_session_days,
    );
    if (ws) {
      pushupWeek = ws.week;
      pushupSession = ws.session;
    }
  }

  const { data: created, error: createError } = await supabase()
    .from('daily_records')
    .insert({
      user_id: userId,
      date: today,
      run_target_km: runTargetKm,
      pushup_week: pushupWeek,
      pushup_session: pushupSession,
    })
    .select()
    .single();

  if (createError || !created) {
    throw new Error(`Failed to create today's record: ${createError?.message ?? 'unknown error'}`);
  }

  return created as DailyRecord;
}

export async function updateDopamineStatus(
  recordId: string,
  status: 'success' | 'fail' | null,
): Promise<DailyRecord> {
  const { data, error } = await supabase()
    .from('daily_records')
    .update({ dopamine_status: status })
    .eq('id', recordId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update dopamine status: ${error?.message ?? 'unknown error'}`);
  }

  return data as DailyRecord;
}

export async function updateRunActual(
  recordId: string,
  actualKm: number,
  targetKm: number,
): Promise<DailyRecord> {
  const runCompleted = actualKm >= targetKm;

  const { data, error } = await supabase()
    .from('daily_records')
    .update({
      run_actual_km: actualKm,
      run_completed: runCompleted,
    })
    .eq('id', recordId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update run actual: ${error?.message ?? 'unknown error'}`);
  }

  return data as DailyRecord;
}

/**
 * Count consecutive days (backwards from yesterday) where dopamine_status = 'success'.
 * Today is excluded because it is still ongoing.
 */
export async function getDopamineStreak(userId: string): Promise<number> {
  const today = getTodayDateString();

  // Fetch all records up to (not including) today, ordered newest first
  const { data, error } = await supabase()
    .from('daily_records')
    .select('date, dopamine_status')
    .eq('user_id', userId)
    .lt('date', today)
    .order('date', { ascending: false });

  if (error || !data) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date(today);
  expectedDate.setDate(expectedDate.getDate() - 1);

  for (const record of data) {
    const recordDate = new Date(record.date);
    const expectedStr = expectedDate.toISOString().slice(0, 10);

    if (record.date !== expectedStr) {
      // Gap in dates - streak broken
      break;
    }

    if (record.dopamine_status !== 'success') {
      break;
    }

    streak++;
    expectedDate.setDate(expectedDate.getDate() - 1);
  }

  return streak;
}

// ============================================================
// Pushup Sets
// ============================================================

export async function getPushupSets(dailyRecordId: string): Promise<PushupSetRecord[]> {
  const { data, error } = await supabase()
    .from('pushup_set_records')
    .select('*')
    .eq('daily_record_id', dailyRecordId)
    .order('set_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch pushup sets: ${error.message}`);
  }

  return (data ?? []) as PushupSetRecord[];
}

/**
 * Create 5 set records for the given daily record with the provided target reps.
 * targetReps should have exactly 5 elements (one per set).
 */
export async function createPushupSets(
  dailyRecordId: string,
  targetReps: number[],
): Promise<PushupSetRecord[]> {
  if (targetReps.length !== 5) {
    throw new Error('targetReps must contain exactly 5 values');
  }

  const rows = targetReps.map((reps, idx) => ({
    daily_record_id: dailyRecordId,
    set_index: idx + 1, // 1-based
    target_reps: reps,
    completed: false,
    completed_at: null,
  }));

  const { data, error } = await supabase()
    .from('pushup_set_records')
    .insert(rows)
    .select();

  if (error || !data) {
    throw new Error(`Failed to create pushup sets: ${error?.message ?? 'unknown error'}`);
  }

  return (data as PushupSetRecord[]).sort((a, b) => a.set_index - b.set_index);
}

export async function completeSet(setId: string): Promise<PushupSetRecord> {
  const { data, error } = await supabase()
    .from('pushup_set_records')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', setId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to complete set: ${error?.message ?? 'unknown error'}`);
  }

  return data as PushupSetRecord;
}

/**
 * Check if all 5 sets are completed. If so, mark pushup_completed = true on
 * the daily record. Returns whether pushup is now fully completed.
 */
export async function checkAndUpdatePushupCompletion(dailyRecordId: string): Promise<boolean> {
  const sets = await getPushupSets(dailyRecordId);

  if (sets.length < 5) {
    return false;
  }

  const allCompleted = sets.every((s) => s.completed);

  if (allCompleted) {
    const { error } = await supabase()
      .from('daily_records')
      .update({ pushup_completed: true })
      .eq('id', dailyRecordId);

    if (error) {
      throw new Error(`Failed to update pushup completion: ${error.message}`);
    }
  }

  return allCompleted;
}

/**
 * Get target reps for a given program level.
 * Returns the 5-element array from the program table.
 */
export function getPushupTargetReps(level: number): number[] {
  const reps = PUSHUP_PROGRAM[level];
  if (!reps) {
    throw new Error(`Invalid pushup program level: ${level}`);
  }
  return reps;
}

// ============================================================
// Weekly Summary
// ============================================================

export async function getWeeklySummary(userId: string): Promise<{
  totalRunKm: number;
  dopamineSuccessDays: number;
  pushupWeekProgress: string;
}> {
  // Determine Monday and Sunday of the current week (ISO week: Mon=start)
  const today = new Date();
  const todayIsoDay = today.getDay() === 0 ? 7 : today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (todayIsoDay - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = sunday.toISOString().slice(0, 10);

  const { data, error } = await supabase()
    .from('daily_records')
    .select('run_actual_km, run_completed, dopamine_status, pushup_week')
    .eq('user_id', userId)
    .gte('date', mondayStr)
    .lte('date', sundayStr);

  if (error) {
    throw new Error(`Failed to fetch weekly summary: ${error.message}`);
  }

  const records = data ?? [];

  const totalRunKm = records.reduce((sum, r) => {
    return sum + (r.run_completed && r.run_actual_km ? Number(r.run_actual_km) : 0);
  }, 0);

  const dopamineSuccessDays = records.filter((r) => r.dopamine_status === 'success').length;

  // Use the most recent pushup_week value recorded this week
  const pushupWeekValues = records
    .map((r) => r.pushup_week)
    .filter((w): w is number => w !== null && w !== undefined);

  const latestPushupWeek =
    pushupWeekValues.length > 0 ? Math.max(...pushupWeekValues) : null;

  const pushupWeekProgress = latestPushupWeek !== null ? `Week ${latestPushupWeek}` : 'Not started';

  return {
    totalRunKm: Math.round(totalRunKm * 10) / 10,
    dopamineSuccessDays,
    pushupWeekProgress,
  };
}

// ============================================================
// Rest Timer (localStorage only)
// ============================================================

export function saveTimerState(state: RestTimerState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
}

export function loadTimerState(): RestTimerState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(TIMER_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RestTimerState;
  } catch {
    return null;
  }
}

export function clearTimerState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TIMER_STATE_KEY);
}
