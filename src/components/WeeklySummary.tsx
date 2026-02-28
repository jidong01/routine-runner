"use client";

interface WeeklySummaryProps {
  summary: {
    totalRunKm: number;
    dopamineSuccessDays: number;
    pushupWeekProgress: string;
  };
}

export default function WeeklySummary({ summary }: WeeklySummaryProps) {
  return (
    <div className="rounded-2xl p-5 bg-gray-900 border border-gray-800 mt-6">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">이번 주 요약</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{summary.totalRunKm}<span className="text-xs text-gray-500 ml-0.5">km</span></p>
          <p className="text-xs text-gray-500 mt-1">달리기 누적</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{summary.dopamineSuccessDays}<span className="text-xs text-gray-500 ml-0.5">일</span></p>
          <p className="text-xs text-gray-500 mt-1">디톡스 성공</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">{summary.pushupWeekProgress}</p>
          <p className="text-xs text-gray-500 mt-1">푸쉬업 진행</p>
        </div>
      </div>
    </div>
  );
}
