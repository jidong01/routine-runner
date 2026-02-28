"use client";

interface HeaderProps {
  completedCount: number;
  totalCount: number;
}

export default function Header({ completedCount, totalCount }: HeaderProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const allDone = completedCount === totalCount;

  return (
    <div className="text-center mb-6">
      <p className="text-gray-400 text-sm">{dateStr}</p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className={`text-2xl font-bold ${allDone ? "text-green-400" : "text-white"}`}>
          {completedCount} / {totalCount}
        </span>
        <span className="text-gray-500 text-sm">완료</span>
      </div>
      <p className="text-gray-600 text-xs mt-1">끊기지 않는 게 목표</p>
    </div>
  );
}
