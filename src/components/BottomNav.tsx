"use client";

interface BottomNavProps {
  activeTab: "today" | "calendar";
  onTabChange: (tab: "today" | "calendar") => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-md mx-auto flex">
        <button
          onClick={() => onTabChange("today")}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
            activeTab === "today" ? "text-blue-400" : "text-gray-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-[10px] font-medium">오늘</span>
        </button>
        <button
          onClick={() => onTabChange("calendar")}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
            activeTab === "calendar" ? "text-blue-400" : "text-gray-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-medium">캘린더</span>
        </button>
      </div>
    </nav>
  );
}
