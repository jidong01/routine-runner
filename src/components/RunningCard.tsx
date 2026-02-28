"use client";

import { useState } from "react";
import { updateRunActual } from "@/lib/api";
import type { DailyRecord } from "@/lib/types";

interface RunningCardProps {
  record: DailyRecord;
  onUpdate: (record: DailyRecord) => void;
}

export default function RunningCard({ record, onUpdate }: RunningCardProps) {
  const [distance, setDistance] = useState<string>(
    record.run_actual_km !== null ? String(record.run_actual_km) : ""
  );
  const [saving, setSaving] = useState(false);

  const targetKm = record.run_target_km ?? 0;
  const actualKm = record.run_actual_km;
  const isCompleted = record.run_completed;
  const hasRecord = actualKm !== null;

  const handleSave = async () => {
    const km = parseFloat(distance);
    if (isNaN(km) || km < 0 || saving) return;

    setSaving(true);
    try {
      const rounded = Math.round(km * 10) / 10;
      const updated = await updateRunActual(record.id, rounded, targetKm);
      onUpdate(updated);
    } catch (err) {
      console.error("Failed to save run:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-2xl p-4 transition-colors ${
      isCompleted ? "bg-green-950/50 border border-green-800/50" :
      hasRecord ? "bg-orange-950/50 border border-orange-800/50" :
      "bg-gray-900 border border-gray-800"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">달리기</h2>
        {hasRecord && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isCompleted ? "bg-green-900/50 text-green-400" : "bg-orange-900/50 text-orange-400"
          }`}>
            {isCompleted ? "달성" : "미달성"}
          </span>
        )}
      </div>

      {/* Target distance - hero display */}
      <div className={`text-center p-2.5 rounded-xl mb-3 ${
        isCompleted ? "bg-green-900/30 border border-green-800/30" :
        hasRecord ? "bg-orange-900/20 border border-orange-800/30" :
        "bg-gray-800/50 border border-gray-700/50"
      }`}>
        <p className="text-gray-400 text-xs mb-1">오늘 목표</p>
        <p className={`text-3xl font-black tracking-tight ${
          isCompleted ? "text-green-400" :
          hasRecord ? "text-orange-400" :
          "text-blue-400"
        }`}>
          {targetKm}<span className="text-lg font-semibold ml-0.5">km</span>
        </p>
        {!hasRecord && (
          <p className="text-gray-600 text-xs mt-1">직전 성공 + 0.2km</p>
        )}
        {hasRecord && (
          <p className={`text-sm font-semibold mt-1 ${isCompleted ? "text-green-500" : "text-orange-500"}`}>
            실제: {actualKm}km {isCompleted ? "— 목표 달성!" : `— ${(targetKm - (actualKm ?? 0)).toFixed(1)}km 부족`}
          </p>
        )}
      </div>

      {/* Input area */}
      {!isCompleted && (
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">실제 거리 (km)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="99"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="0.0"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-lg font-medium text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !distance}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
              saving || !distance
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            {saving ? "..." : "저장"}
          </button>
        </div>
      )}
    </div>
  );
}
