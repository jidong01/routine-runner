"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, getOrCreateTodayRecord, getDopamineStreak, getWeeklySummary, getPushupSets, createPushupSets, onAuthStateChange, signOut } from "@/lib/api";
import { getPushupSession } from "@/data/pushup-program";
import type { User, DailyRecord, PushupSetRecord } from "@/lib/types";
import type { PushupLevel } from "@/data/pushup-program";
import Header from "@/components/Header";
import DopamineCard from "@/components/DopamineCard";
import RunningCard from "@/components/RunningCard";
import PushupCard from "@/components/PushupCard";
import WeeklySummary from "@/components/WeeklySummary";
import OnboardingModal from "@/components/OnboardingModal";
import LoginScreen from "@/components/LoginScreen";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [pushupSets, setPushupSets] = useState<PushupSetRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [weeklySummary, setWeeklySummary] = useState<{
    totalRunKm: number;
    dopamineSuccessDays: number;
    pushupWeekProgress: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await getCurrentUser();
      if (!userData) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setUser(userData);
      setIsAuthenticated(true);

      // Check if user needs onboarding (no pushup start date means not set up yet)
      if (!userData.pushup_program_start_date) {
        setShowOnboarding(true);
        setLoading(false);
        return;
      }

      const [todayRecord, dopamineStreak, summary] = await Promise.all([
        getOrCreateTodayRecord(userData.id),
        getDopamineStreak(userData.id),
        getWeeklySummary(userData.id),
      ]);

      setRecord(todayRecord);
      setStreak(dopamineStreak);
      setWeeklySummary(summary);

      // Load or create pushup sets if today is a pushup day
      if (todayRecord.pushup_week && todayRecord.pushup_session) {
        let sets = await getPushupSets(todayRecord.id);
        if (sets.length === 0) {
          // Create sets from program data
          const targetReps = getPushupSession(
            userData.pushup_program_level as PushupLevel,
            todayRecord.pushup_week,
            todayRecord.pushup_session
          );
          if (targetReps) {
            sets = await createPushupSets(todayRecord.id, targetReps);
          }
        }
        setPushupSets(sets);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRecord(null);
        setIsAuthenticated(false);
      }
      setAuthReady(true);
    });

    // Initial load
    loadData().then(() => setAuthReady(true));

    return () => subscription.unsubscribe();
  }, [loadData]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    loadData();
  }, [loadData]);

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !loading) {
    return <LoginScreen />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-red-400 text-center">{error}</div>
        <button
          onClick={() => loadData()}
          className="px-6 py-3 bg-blue-600 rounded-xl text-white font-medium"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (showOnboarding && user) {
    return <OnboardingModal user={user} onComplete={handleOnboardingComplete} />;
  }

  if (!record || !user) return null;

  // Calculate completion rate
  // Pushup rest day: exclude from count
  const isPushupDay = record.pushup_week !== null && record.pushup_session !== null;
  const totalRoutines = isPushupDay ? 3 : 2;
  let completedRoutines = 0;
  if (record.dopamine_status === "success") completedRoutines++;
  if (record.run_completed) completedRoutines++;
  if (isPushupDay && record.pushup_completed) completedRoutines++;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Header
          completedCount={completedRoutines}
          totalCount={totalRoutines}
        />
        <button
          onClick={async () => { await signOut(); }}
          className="absolute top-0 right-0 text-gray-600 text-xs hover:text-gray-400 py-1 px-2"
        >
          로그아웃
        </button>
      </div>

      <DopamineCard
        record={record}
        streak={streak}
        onUpdate={(updated) => {
          setRecord(updated);
          // Update streak if success
          if (updated.dopamine_status === "success") {
            setStreak((prev) => prev + 1);
          }
        }}
      />

      <RunningCard
        record={record}
        onUpdate={(updated) => setRecord(updated)}
      />

      <PushupCard
        record={record}
        sets={pushupSets}
        user={user}
        onRecordUpdate={(updated) => setRecord(updated)}
        onSetsUpdate={(updated) => setPushupSets(updated)}
      />

      {weeklySummary && (
        <WeeklySummary summary={weeklySummary} />
      )}
    </div>
  );
}
