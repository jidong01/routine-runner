"use client";

import { useState } from "react";
import { updateUserSettings } from "@/lib/api";
import { determinePushupLevel } from "@/data/pushup-program";
import type { User } from "@/lib/types";

interface OnboardingModalProps {
  user: User;
  onComplete: () => void;
}

export default function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [maxPushups, setMaxPushups] = useState("");
  const [runStartKm, setRunStartKm] = useState("1.0");
  const [restTimer, setRestTimer] = useState(60);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const pushupMax = parseInt(maxPushups) || 0;
      const level = determinePushupLevel(pushupMax);
      const startKm = parseFloat(runStartKm) || 1.0;

      // Set today as the program start date
      const today = new Date().toISOString().slice(0, 10);

      await updateUserSettings(user.id, {
        pushup_program_level: level,
        pushup_program_start_date: today,
        run_start_km: Math.round(startKm * 10) / 10,
        rest_timer_default_sec: restTimer,
      });

      onComplete();
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSaving(false);
    }
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center">
      <div className="text-5xl mb-4">💪</div>
      <h1 className="text-2xl font-bold mb-2">루틴 실행기</h1>
      <p className="text-gray-400 text-sm mb-8">
        매일 3가지 핵심 루틴을<br />
        생각하지 않고 바로 실행하세요
      </p>
      <button
        onClick={() => setStep(1)}
        className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold active:scale-95 transition-transform"
      >
        시작하기
      </button>
    </div>,

    // Step 1: Pushup test
    <div key="pushup">
      <h2 className="text-xl font-bold mb-2">푸쉬업 테스트</h2>
      <p className="text-gray-400 text-sm mb-6">
        한 번에 최대 몇 개까지 할 수 있나요?<br />
        이 결과로 6주 프로그램 레벨이 결정됩니다.
      </p>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        max="200"
        value={maxPushups}
        onChange={(e) => setMaxPushups(e.target.value)}
        placeholder="최대 개수"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 text-xl text-center font-medium text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 mb-3"
      />
      {maxPushups && (
        <p className="text-blue-400 text-sm text-center mb-4">
          레벨 {determinePushupLevel(parseInt(maxPushups) || 0)}로 시작합니다
        </p>
      )}
      <button
        onClick={() => setStep(2)}
        disabled={!maxPushups}
        className={`w-full py-4 rounded-xl text-lg font-semibold active:scale-95 transition-all ${
          maxPushups ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500 cursor-not-allowed"
        }`}
      >
        다음
      </button>
    </div>,

    // Step 2: Running start distance
    <div key="running">
      <h2 className="text-xl font-bold mb-2">달리기 시작 거리</h2>
      <p className="text-gray-400 text-sm mb-6">
        첫 번째 달리기 목표 거리를 정해주세요.<br />
        성공할 때마다 0.2km씩 늘어납니다.
      </p>
      <div className="flex items-center justify-center gap-2 mb-6">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0.1"
          max="50"
          value={runStartKm}
          onChange={(e) => setRunStartKm(e.target.value)}
          className="w-28 bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 text-xl text-center font-medium text-white focus:outline-none focus:border-blue-500"
        />
        <span className="text-gray-400 text-lg">km</span>
      </div>
      <button
        onClick={() => setStep(3)}
        className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold active:scale-95 transition-transform"
      >
        다음
      </button>
    </div>,

    // Step 3: Rest timer
    <div key="timer">
      <h2 className="text-xl font-bold mb-2">휴식 타이머</h2>
      <p className="text-gray-400 text-sm mb-6">
        푸쉬업 세트 사이 쉬는 시간을 선택하세요.
      </p>
      <div className="space-y-3 mb-6">
        {[45, 60, 90].map((sec) => (
          <button
            key={sec}
            onClick={() => setRestTimer(sec)}
            className={`w-full py-4 rounded-xl text-lg font-semibold transition-all active:scale-95 ${
              restTimer === sec
                ? "bg-blue-600 text-white border border-blue-500"
                : "bg-gray-800 text-gray-300 border border-gray-700"
            }`}
          >
            {sec}초
          </button>
        ))}
      </div>
      <button
        onClick={handleFinish}
        disabled={saving}
        className={`w-full py-4 rounded-xl text-lg font-semibold active:scale-95 transition-all ${
          saving ? "bg-gray-700 text-gray-400" : "bg-green-600 text-white"
        }`}
      >
        {saving ? "설정 중..." : "완료"}
      </button>
    </div>,
  ];

  return (
    <div className="flex flex-col justify-center min-h-[70vh]">
      {/* Step indicators */}
      <div className="flex justify-center gap-2 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? "w-8 bg-blue-500" : i < step ? "w-4 bg-blue-800" : "w-4 bg-gray-800"
            }`}
          />
        ))}
      </div>
      {steps[step]}
    </div>
  );
}
