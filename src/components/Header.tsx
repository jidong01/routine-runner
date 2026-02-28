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
    <div className="flex items-center justify-between mb-1">
      <p className="text-gray-400 text-sm">{dateStr}</p>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: totalCount }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < completedCount
                  ? allDone ? "bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]" : "bg-blue-400"
                  : "bg-gray-700"
              }`}
            />
          ))}
        </div>
        <span className={`text-lg font-black ${allDone ? "text-green-400" : "text-white"}`}>
          {completedCount}/{totalCount}
        </span>
      </div>
    </div>
  );
}
