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
      <div className="rounded-2xl p-5 bg-gray-900 border border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">푸쉬업</h2>
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
    <div className={`rounded-2xl p-5 transition-colors ${
      isCompleted ? "bg-green-950/50 border border-green-800/50" :
      completedSets > 0 ? "bg-blue-950/50 border border-blue-800/50" :
      "bg-gray-900 border border-gray-800"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">푸쉬업</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            Week {record.pushup_week} · Session {record.pushup_session}
          </p>
        </div>
        <div className="text-right">
          {isCompleted ? (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-900/50 text-green-400">
              완료
            </span>
          ) : (
            <span className="text-sm text-gray-400">
              {completedSets} / 5 세트
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${(completedSets / 5) * 100}%` }}
        />
      </div>

      {/* Timer overlay */}
      {timerState && (
        <div className="mb-4 p-4 rounded-xl bg-blue-950/80 border border-blue-800/50 text-center timer-pulse">
          <p className="text-gray-400 text-xs mb-1">휴식 중</p>
          <p className="text-4xl font-mono font-bold text-blue-400">
            {formatTime(timerState.remainingSec)}
          </p>
          <div className="flex gap-3 mt-3 justify-center">
            {timerState.isRunning ? (
              <button
                onClick={pauseTimer}
                className="px-4 py-2 bg-gray-700 rounded-lg text-sm text-gray-300 active:scale-95"
              >
                일시정지
              </button>
            ) : (
              <button
                onClick={resumeTimer}
                className="px-4 py-2 bg-blue-700 rounded-lg text-sm text-white active:scale-95"
              >
                재개
              </button>
            )}
            <button
              onClick={skipTimer}
              className="px-4 py-2 bg-gray-700 rounded-lg text-sm text-gray-300 active:scale-95"
            >
              건너뛰기
            </button>
          </div>
        </div>
      )}

      {/* Sets list */}
      <div className="space-y-2">
        {sets.map((set, idx) => {
          const isActive = idx === currentSetIndex && !timerState;
          const isCurrentSetDone = set.completed;
          const isLocked = idx > currentSetIndex && !isCurrentSetDone;

          return (
            <button
              key={set.id}
              onClick={() => isActive && handleCompleteSet(set)}
              disabled={!isActive || saving}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                isCurrentSetDone
                  ? "bg-green-900/30 border border-green-800/30"
                  : isActive
                  ? "bg-blue-900/30 border border-blue-700/50 active:scale-[0.98]"
                  : "bg-gray-800/50 border border-gray-800 opacity-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCurrentSetDone
                    ? "bg-green-600 text-white"
                    : isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-400"
                }`}>
                  {isCurrentSetDone ? "✓" : set.set_index}
                </div>
                <span className={`font-medium ${
                  isCurrentSetDone ? "text-green-400" :
                  isActive ? "text-white" : "text-gray-500"
                }`}>
                  {set.target_reps}개
                </span>
              </div>
              {isActive && !saving && (
                <span className="text-blue-400 text-sm font-medium">탭하여 완료</span>
              )}
              {isActive && saving && (
                <span className="text-gray-500 text-sm">저장 중...</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
