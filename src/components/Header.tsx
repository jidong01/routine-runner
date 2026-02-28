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
    <div className="text-center mb-2">
      <p className="text-gray-400 text-sm">{dateStr}</p>
      <div className="mt-1 flex items-center justify-center gap-3">
        {/* Progress circles */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalCount }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < completedCount
                  ? allDone ? "bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]" : "bg-blue-400"
                  : "bg-gray-700"
              }`}
            />
          ))}
        </div>
        <span className={`text-xl font-black ${allDone ? "text-green-400" : "text-white"}`}>
          {completedCount}/{totalCount}
        </span>
      </div>
      <p className={`text-xs mt-0.5 ${allDone ? "text-green-500 font-medium" : "text-gray-600"}`}>
        {allDone ? "오늘 루틴 완료!" : "끊기지 않는 게 목표"}
      </p>
    </div>
  );
}
