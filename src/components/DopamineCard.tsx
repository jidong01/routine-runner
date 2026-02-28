"use client";

import { useState } from "react";
import { updateDopamineStatus } from "@/lib/api";
import type { DailyRecord } from "@/lib/types";

interface DopamineCardProps {
  record: DailyRecord;
  streak: number;
  onUpdate: (record: DailyRecord) => void;
}

export default function DopamineCard({ record, streak, onUpdate }: DopamineCardProps) {
  const [saving, setSaving] = useState(false);

  const handleStatus = async (status: "success" | "fail") => {
    if (saving) return;

    // If tapping the same status, toggle it off (set to null)
    const newStatus = record.dopamine_status === status ? null : status;

    setSaving(true);
    try {
      const updated = await updateDopamineStatus(record.id, newStatus);
      onUpdate(updated);
    } catch (err) {
      console.error("Failed to update dopamine status:", err);
    } finally {
      setSaving(false);
    }
  };

  const isSuccess = record.dopamine_status === "success";
  const isFail = record.dopamine_status === "fail";
  const isDone = isSuccess || isFail;

  // Streak milestone messages
  const getStreakMessage = (days: number): string | null => {
    if (days >= 30) return "한 달 완주!";
    if (days >= 14) return "2주 연속!";
    if (days >= 7) return "일주일 돌파!";
    if (days >= 3) return "좋은 시작!";
    return null;
  };

  const streakMessage = getStreakMessage(streak);
  const displayStreak = isSuccess ? streak + 1 : streak;

  return (
    <div className={`rounded-2xl p-4 transition-colors ${
      isSuccess ? "bg-green-950/50 border border-green-800/50" :
      isFail ? "bg-red-950/50 border border-red-800/50" :
      "bg-gray-900 border border-gray-800"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">도파민 디톡스</h2>
        {isDone && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isSuccess ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
          }`}>
            {isSuccess ? "성공" : "실패"}
          </span>
        )}
      </div>

      {/* Streak Display */}
      {displayStreak > 0 && (
        <div className="flex items-center gap-4 mb-2 p-2 rounded-xl bg-green-950/40 border border-green-900/30">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-green-900/60 flex items-center justify-center border-2 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <span className="text-lg font-black text-green-400">{displayStreak}</span>
            </div>
          </div>
          <div>
            <p className="text-green-300 font-bold text-sm">D+{displayStreak} 연속 성공</p>
            {streakMessage && (
              <p className="text-green-500 text-sm mt-0.5">{streakMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* No streak yet */}
      {displayStreak === 0 && !isDone && (
        <p className="text-gray-500 text-sm mb-2">오늘부터 연속 기록을 시작하세요</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleStatus("success")}
          disabled={saving}
          className={`flex-1 py-2.5 rounded-xl text-base font-semibold transition-all active:scale-95 ${
            isSuccess
              ? "bg-green-600 text-white shadow-lg shadow-green-900/50"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          성공
        </button>
        <button
          onClick={() => handleStatus("fail")}
          disabled={saving}
          className={`flex-1 py-2.5 rounded-xl text-base font-semibold transition-all active:scale-95 ${
            isFail
              ? "bg-red-600 text-white shadow-lg shadow-red-900/50"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          실패
        </button>
      </div>
    </div>
  );
}
