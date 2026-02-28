export type PushupLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface PushupSession {
  sets: [number, number, number, number, number]; // 5 sets of reps
}

export interface PushupWeek {
  sessions: [PushupSession, PushupSession, PushupSession]; // 3 sessions per week
}

export interface PushupProgram {
  weeks: [PushupWeek, PushupWeek, PushupWeek, PushupWeek, PushupWeek, PushupWeek]; // 6 weeks
}

function s(sets: [number, number, number, number, number]): PushupSession {
  return { sets };
}

function w(
  s1: [number, number, number, number, number],
  s2: [number, number, number, number, number],
  s3: [number, number, number, number, number]
): PushupWeek {
  return { sessions: [{ sets: s1 }, { sets: s2 }, { sets: s3 }] };
}

export const PUSHUP_PROGRAMS: Record<PushupLevel, PushupProgram> = {
  1: {
    weeks: [
      w([2, 3, 2, 2, 3],   [3, 4, 2, 3, 4],   [4, 5, 4, 4, 5]),
      w([4, 6, 4, 4, 6],   [5, 6, 4, 4, 7],   [5, 7, 5, 5, 8]),
      w([10, 12, 7, 7, 9], [10, 12, 8, 8, 12], [11, 13, 9, 9, 13]),
      w([12, 14, 11, 10, 16], [14, 16, 12, 12, 18], [16, 18, 13, 13, 20]),
      w([17, 19, 15, 15, 20], [20, 23, 16, 16, 25], [22, 25, 18, 18, 28]),
      w([25, 30, 20, 15, 40], [28, 33, 25, 25, 44], [30, 35, 28, 28, 48]),
    ],
  },
  2: {
    weeks: [
      w([3, 4, 2, 3, 4],   [4, 5, 4, 4, 5],   [5, 6, 4, 4, 6]),
      w([5, 7, 5, 5, 8],   [6, 8, 6, 6, 8],   [7, 10, 6, 6, 9]),
      w([12, 14, 11, 10, 16], [14, 16, 12, 12, 17], [16, 17, 14, 14, 20]),
      w([18, 20, 15, 15, 22], [20, 22, 16, 16, 25], [22, 24, 18, 18, 28]),
      w([25, 28, 20, 20, 30], [28, 30, 22, 22, 34], [30, 33, 25, 25, 38]),
      w([35, 40, 28, 28, 45], [38, 42, 30, 30, 50], [40, 45, 33, 33, 55]),
    ],
  },
  3: {
    weeks: [
      w([6, 6, 4, 4, 5],   [6, 8, 6, 6, 7],   [8, 10, 7, 7, 10]),
      w([9, 11, 8, 8, 11], [10, 12, 9, 9, 13], [12, 13, 10, 10, 15]),
      w([14, 16, 12, 12, 17], [16, 18, 13, 13, 20], [18, 20, 15, 15, 22]),
      w([20, 25, 15, 15, 25], [22, 28, 18, 18, 28], [25, 30, 20, 20, 32]),
      w([28, 33, 25, 25, 36], [30, 36, 28, 28, 40], [33, 38, 30, 30, 44]),
      w([40, 45, 35, 35, 50], [42, 48, 38, 38, 55], [45, 50, 40, 40, 60]),
    ],
  },
  4: {
    weeks: [
      w([9, 11, 8, 8, 11],  [10, 12, 9, 9, 13],  [12, 13, 10, 10, 15]),
      w([14, 14, 10, 10, 15], [14, 16, 12, 12, 17], [16, 18, 13, 13, 20]),
      w([18, 22, 16, 16, 20], [20, 25, 18, 18, 25], [22, 28, 20, 20, 28]),
      w([25, 30, 20, 20, 32], [28, 33, 23, 23, 36], [30, 36, 25, 25, 40]),
      w([35, 40, 30, 30, 42], [38, 42, 33, 33, 46], [40, 45, 35, 35, 50]),
      w([45, 50, 38, 38, 55], [48, 55, 42, 42, 60], [50, 58, 45, 45, 65]),
    ],
  },
  5: {
    weeks: [
      w([12, 13, 10, 10, 15], [14, 14, 11, 11, 17], [16, 17, 14, 14, 20]),
      w([17, 19, 15, 15, 20], [20, 22, 16, 16, 25], [22, 25, 18, 18, 28]),
      w([25, 28, 20, 20, 30], [28, 30, 22, 22, 34], [30, 33, 25, 25, 38]),
      w([33, 36, 28, 28, 40], [35, 38, 30, 30, 44], [38, 40, 33, 33, 48]),
      w([42, 45, 35, 35, 50], [45, 48, 38, 38, 55], [48, 50, 40, 40, 58]),
      w([50, 55, 42, 42, 60], [55, 58, 45, 45, 65], [58, 60, 48, 48, 70]),
    ],
  },
  6: {
    weeks: [
      w([16, 18, 13, 13, 20], [18, 20, 15, 15, 22], [20, 22, 16, 16, 25]),
      w([22, 25, 18, 18, 28], [25, 28, 20, 20, 32], [28, 30, 22, 22, 35]),
      w([30, 34, 25, 25, 35], [33, 36, 28, 28, 38], [35, 38, 30, 30, 42]),
      w([38, 42, 33, 33, 45], [40, 45, 35, 35, 48], [42, 48, 38, 38, 52]),
      w([48, 52, 40, 40, 55], [50, 55, 42, 42, 58], [52, 58, 45, 45, 62]),
      w([55, 60, 45, 45, 65], [58, 63, 48, 48, 70], [60, 65, 50, 50, 75]),
    ],
  },
  7: {
    weeks: [
      w([20, 22, 16, 16, 25], [22, 25, 18, 18, 28], [25, 28, 20, 20, 32]),
      w([28, 30, 22, 22, 35], [30, 33, 25, 25, 38], [33, 36, 28, 28, 42]),
      w([35, 38, 30, 30, 42], [38, 42, 33, 33, 46], [40, 45, 35, 35, 50]),
      w([42, 48, 38, 38, 52], [45, 50, 40, 40, 56], [48, 52, 42, 42, 60]),
      w([52, 58, 45, 45, 60], [55, 60, 48, 48, 65], [58, 63, 50, 50, 68]),
      w([60, 65, 50, 50, 70], [63, 68, 55, 55, 75], [65, 70, 58, 58, 80]),
    ],
  },
};

/**
 * Determine the starting level based on the user's initial max pushup test.
 */
export function determinePushupLevel(maxReps: number): PushupLevel {
  if (maxReps <= 5) return 1;
  if (maxReps <= 10) return 2;
  if (maxReps <= 20) return 3;
  if (maxReps <= 25) return 4;
  if (maxReps <= 30) return 5;
  if (maxReps <= 35) return 6;
  return 7;
}

/**
 * Get the reps for a given level, week (1-6), and session (1-3).
 * Returns null if the week or session is out of range.
 */
export function getPushupSession(
  level: PushupLevel,
  week: number,
  session: number
): number[] | null {
  if (week < 1 || week > 6) return null;
  if (session < 1 || session > 3) return null;

  const program = PUSHUP_PROGRAMS[level];
  const weekData = program.weeks[week - 1];
  const sessionData = weekData.sessions[session - 1];
  return [...sessionData.sets];
}

/**
 * Check if a given date is a pushup day.
 * sessionDays is an array of day-of-week numbers (0=Sun, 1=Mon, ..., 6=Sat).
 */
export function isPushupDay(sessionDays: number[], date: Date): boolean {
  return sessionDays.includes(date.getDay());
}

/**
 * Calculate the current week and session based on start date and chosen session days.
 * Returns { week, session } (both 1-indexed) if today is a session day,
 * or null if today is a rest day.
 *
 * sessionDays: sorted array of day-of-week numbers (e.g. [1, 3, 5] for Mon/Wed/Fri).
 */
export function calculateCurrentSession(
  startDate: Date,
  sessionDays: number[]
): { week: number; session: number } | null {
  const today = new Date();

  // Normalize both dates to midnight local time for day-level comparison
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const current = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (current < start) return null;

  // Collect all session dates from start onwards (up to 6 weeks = 18 sessions)
  const sortedDays = [...sessionDays].sort((a, b) => a - b);
  const sessionDates: Date[] = [];

  // Iterate day by day from start date, collecting matching session days
  // We need at most 18 sessions (6 weeks * 3 sessions), but scan generously
  const scanDate = new Date(start);
  while (sessionDates.length < 18) {
    if (sortedDays.includes(scanDate.getDay())) {
      sessionDates.push(new Date(scanDate));
    }
    scanDate.setDate(scanDate.getDate() + 1);

    // Safety: don't scan more than 18 weeks out
    const maxScanMs = 18 * 7 * 24 * 60 * 60 * 1000;
    if (scanDate.getTime() - start.getTime() > maxScanMs) break;
  }

  // Find if today matches any session date
  const sessionIndex = sessionDates.findIndex(
    (d) =>
      d.getFullYear() === current.getFullYear() &&
      d.getMonth() === current.getMonth() &&
      d.getDate() === current.getDate()
  );

  if (sessionIndex === -1) return null; // rest day

  const week = Math.floor(sessionIndex / 3) + 1;
  const session = (sessionIndex % 3) + 1;

  if (week > 6) return null; // program completed

  return { week, session };
}
