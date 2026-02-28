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

  return (
    <div className={`rounded-2xl p-5 transition-colors ${
      isSuccess ? "bg-green-950/50 border border-green-800/50" :
      isFail ? "bg-red-950/50 border border-red-800/50" :
      "bg-gray-900 border border-gray-800"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">도파민 디톡스</h2>
          {streak > 0 && (
            <p className="text-green-400 text-xs mt-0.5">D+{streak} 연속 성공</p>
          )}
        </div>
        {isDone && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isSuccess ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
          }`}>
            {isSuccess ? "성공" : "실패"}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleStatus("success")}
          disabled={saving}
          className={`flex-1 py-4 rounded-xl text-base font-semibold transition-all active:scale-95 ${
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
          className={`flex-1 py-4 rounded-xl text-base font-semibold transition-all active:scale-95 ${
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
