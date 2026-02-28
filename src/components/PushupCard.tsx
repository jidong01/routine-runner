"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { completeSet, checkAndUpdatePushupCompletion, saveTimerState, loadTimerState, clearTimerState } from "@/lib/api";
import type { DailyRecord, PushupSetRecord, RestTimerState, User } from "@/lib/types";

interface PushupCardProps {
  record: DailyRecord;
  sets: PushupSetRecord[];
  user: User;
  onRecordUpdate: (record: DailyRecord) => void;
  onSetsUpdate: (sets: PushupSetRecord[]) => void;
}

export default function PushupCard({ record, sets, user, onRecordUpdate, onSetsUpdate }: PushupCardProps) {
  const [timerState, setTimerState] = useState<RestTimerState | null>(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isPushupDay = record.pushup_week !== null && record.pushup_session !== null;
  const isCompleted = record.pushup_completed;
  const completedSets = sets.filter(s => s.completed).length;
  const totalTargetReps = sets.reduce((sum, s) => sum + s.target_reps, 0);
  const completedReps = sets.filter(s => s.completed).reduce((sum, s) => sum + s.target_reps, 0);

  // Find the current active set (first uncompleted)
  const currentSetIndex = sets.findIndex(s => !s.completed);
  const isTimerActive = timerState !== null && timerState.isRunning;

  // Timer logic
  const startTimer = useCallback((setIndex: number) => {
    const duration = user.rest_timer_default_sec;
    const newState: RestTimerState = {
      currentSetIndex: setIndex,
      startedAt: Date.now(),
      durationSec: duration,
      remainingSec: duration,
      isRunning: true,
    };
    setTimerState(newState);
    saveTimerState(newState);
  }, [user.rest_timer_default_sec]);

  const pauseTimer = useCallback(() => {
    if (!timerState) return;
    const updated = { ...timerState, isRunning: false };
    setTimerState(updated);
    saveTimerState(updated);
  }, [timerState]);

  const resumeTimer = useCallback(() => {
    if (!timerState) return;
    const updated = { ...timerState, isRunning: true, startedAt: Date.now() };
    setTimerState(updated);
    saveTimerState(updated);
  }, [timerState]);

  const skipTimer = useCallback(() => {
    setTimerState(null);
    clearTimerState();
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (!timerState || !timerState.isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimerState(prev => {
        if (!prev || !prev.isRunning) return prev;
        const newRemaining = prev.remainingSec - 1;
        if (newRemaining <= 0) {
          clearTimerState();
          return null;
        }
        const updated = { ...prev, remainingSec: newRemaining };
        saveTimerState(updated);
        return updated;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerState?.isRunning]);

  // Restore timer on mount
  useEffect(() => {
    const saved = loadTimerState();
    if (saved && saved.isRunning) {
      // Calculate elapsed time
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      const remaining = saved.remainingSec - elapsed;
      if (remaining > 0) {
        setTimerState({ ...saved, remainingSec: remaining });
      } else {
        clearTimerState();
      }
    }
  }, []);

  const handleCompleteSet = async (set: PushupSetRecord) => {
    if (saving || set.completed) return;

    setSaving(true);
    try {
      const updatedSet = await completeSet(set.id);
      const newSets = sets.map(s => s.id === updatedSet.id ? updatedSet : s);
      onSetsUpdate(newSets);

      // Check if all 5 sets completed
      const allDone = await checkAndUpdatePushupCompletion(record.id);
      if (allDone) {
        onRecordUpdate({ ...record, pushup_completed: true });
      } else if (set.set_index < 5) {
        // Start rest timer for sets 1-4
        startTimer(set.set_index);
      }
    } catch (err) {
      console.error("Failed to complete set:", err);
    } finally {
      setSaving(false);
    }
  };

  // REST DAY view
  if (!isPushupDay) {
    return (
      <div className="rounded-2xl p-3 bg-gray-900 border border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">푸쉬업</h2>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-800 text-gray-400">
            휴식일
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-2">오늘은 쉬는 날이에요</p>
      </div>
    );
  }

  // Timer display
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`rounded-2xl p-3 transition-colors ${
      isCompleted ? "bg-green-950/50 border border-green-800/50" :
      completedSets > 0 ? "bg-blue-950/50 border border-blue-800/50" :
      "bg-gray-900 border border-gray-800"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">푸쉬업</h2>
          <span className="text-xs text-gray-500">W{record.pushup_week}·S{record.pushup_session}</span>
          <span className={`text-sm font-bold ${
            isCompleted ? "text-green-400" :
            completedSets > 0 ? "text-blue-400" : "text-gray-400"
          }`}>
            {completedReps}/{totalTargetReps}개
          </span>
        </div>
        {isCompleted ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">완료</span>
        ) : (
          <span className="text-xs text-gray-400">{completedSets}/5</span>
        )}
      </div>

      {/* Timer overlay */}
      {timerState && (
        <div className="mb-2 p-2 rounded-xl bg-blue-950/80 border border-blue-800/50 text-center timer-pulse">
          <p className="text-gray-400 text-xs mb-1">휴식 중</p>
          <p className="text-2xl font-mono font-bold text-blue-400">
            {formatTime(timerState.remainingSec)}
          </p>
          <div className="flex gap-2 mt-1.5 justify-center">
            {timerState.isRunning ? (
              <button
                onClick={pauseTimer}
                className="px-3 py-1.5 bg-gray-700 rounded-lg text-sm text-gray-300 active:scale-95"
              >
                일시정지
              </button>
            ) : (
              <button
                onClick={resumeTimer}
                className="px-3 py-1.5 bg-blue-700 rounded-lg text-sm text-white active:scale-95"
              >
                재개
              </button>
            )}
            <button
              onClick={skipTimer}
              className="px-3 py-1.5 bg-gray-700 rounded-lg text-sm text-gray-300 active:scale-95"
            >
              건너뛰기
            </button>
          </div>
        </div>
      )}

      {/* Sets - horizontal */}
      <div className="flex gap-2">
        {sets.map((set, idx) => {
          const isActive = idx === currentSetIndex && !timerState;
          const isCurrentSetDone = set.completed;

          return (
            <button
              key={set.id}
              onClick={() => isActive && handleCompleteSet(set)}
              disabled={!isActive || saving}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${
                isCurrentSetDone
                  ? "bg-green-900/30 border border-green-800/30"
                  : isActive
                  ? "bg-blue-900/30 border border-blue-700/50 active:scale-95"
                  : "bg-gray-800/50 border border-gray-800 opacity-50"
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isCurrentSetDone
                  ? "bg-green-600 text-white"
                  : isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400"
              }`}>
                {isCurrentSetDone ? "✓" : set.set_index}
              </div>
              <span className={`text-xs mt-1 ${
                isCurrentSetDone ? "text-green-400" :
                isActive ? "text-white" : "text-gray-500"
              }`}>
                {set.target_reps}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
