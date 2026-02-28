"use client";

import { useState, useEffect, useCallback } from "react";
import { getMonthlyRecords } from "@/lib/api";
import type { DailyRecord } from "@/lib/types";

interface CalendarViewProps {
  userId: string;
}

export default function CalendarView({ userId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [records, setRecords] = useState<Map<string, DailyRecord>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadMonth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMonthlyRecords(userId, year, month + 1);
      const map = new Map<string, DailyRecord>();
      data.forEach((r) => map.set(r.date, r));
      setRecords(map);
    } catch (err) {
      console.error("Failed to load monthly records:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const goToPrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const todayStr = new Date().toISOString().slice(0, 10);

  const getCompletionLevel = (record: DailyRecord | undefined): number => {
    if (!record) return 0;
    return record.completed_count;
  };

  const getDotColor = (level: number): string => {
    if (level >= 3) return "bg-green-400";
    if (level === 2) return "bg-yellow-400";
    if (level === 1) return "bg-orange-400";
    return "";
  };

  const selectedRecord = selectedDate ? records.get(selectedDate) : null;

  const weekDayHeaders = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1 mb-2">
        <button onClick={goToPrevMonth} className="p-2 text-gray-400 active:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-white">
          {year}년 {month + 1}월
        </h2>
        <button onClick={goToNextMonth} className="p-2 text-gray-400 active:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center mb-0.5">
        {weekDayHeaders.map((day) => (
          <div key={day} className="text-[10px] text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 text-center gap-y-0.5">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const record = records.get(dateStr);
          const level = getCompletionLevel(record);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && setSelectedDate(isSelected ? null : dateStr)}
              disabled={isFuture}
              className={`h-10 flex flex-col items-center justify-center rounded-lg transition-colors ${
                isSelected
                  ? "bg-blue-900/50 border border-blue-700/50"
                  : isToday
                  ? "bg-gray-800 border border-gray-700"
                  : ""
              } ${isFuture ? "opacity-30" : "active:bg-gray-800"}`}
            >
              <span className={`text-xs ${
                isToday ? "font-bold text-blue-400" :
                isFuture ? "text-gray-600" : "text-gray-300"
              }`}>
                {day}
              </span>
              {level > 0 && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${getDotColor(level)}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span className="text-[10px] text-gray-500">1/3</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="text-[10px] text-gray-500">2/3</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-gray-500">3/3</span>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="rounded-2xl p-3 bg-gray-900 border border-gray-800">
          <p className="text-sm font-semibold text-gray-300 mb-2">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </p>
          {selectedRecord ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">도파민 디톡스</span>
                <span className={`text-sm font-medium ${
                  selectedRecord.dopamine_status === "success" ? "text-green-400" :
                  selectedRecord.dopamine_status === "fail" ? "text-red-400" : "text-gray-600"
                }`}>
                  {selectedRecord.dopamine_status === "success" ? "성공" :
                   selectedRecord.dopamine_status === "fail" ? "실패" : "미기록"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">달리기</span>
                <span className={`text-sm font-medium ${
                  selectedRecord.run_completed ? "text-green-400" :
                  selectedRecord.run_actual_km !== null ? "text-orange-400" : "text-gray-600"
                }`}>
                  {selectedRecord.run_actual_km !== null
                    ? `${selectedRecord.run_actual_km}km ${selectedRecord.run_completed ? "달성" : "미달성"}`
                    : "미기록"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">푸쉬업</span>
                <span className={`text-sm font-medium ${
                  selectedRecord.pushup_completed ? "text-green-400" :
                  selectedRecord.pushup_week === null ? "text-gray-600" : "text-gray-500"
                }`}>
                  {selectedRecord.pushup_week === null
                    ? "휴식일"
                    : selectedRecord.pushup_completed ? "완료" : "미완료"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">기록 없음</p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
