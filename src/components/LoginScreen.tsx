"use client";

import { useState } from "react";
import { signInWithEmail, signInAnonymously } from "@/lib/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError(null);

    const result = await signInWithEmail(email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center mb-4 border border-blue-700/50">
          <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">메일을 확인하세요</h2>
        <p className="text-gray-400 text-sm mb-1">
          <span className="text-white font-medium">{email}</span>
        </p>
        <p className="text-gray-500 text-sm">로 로그인 링크를 보냈습니다</p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="mt-6 text-blue-400 text-sm underline"
        >
          다른 이메일로 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center min-h-[70vh]">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center mx-auto mb-4 border border-blue-700/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <span className="text-2xl font-black text-blue-400">R</span>
        </div>
        <h1 className="text-2xl font-bold text-white">루틴 실행기</h1>
        <p className="text-gray-500 text-sm mt-1">이메일로 간편하게 시작하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            required
            autoComplete="email"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-4 text-base text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className={`w-full py-4 rounded-xl text-base font-semibold transition-all active:scale-95 ${
            loading || !email
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          {loading ? "전송 중..." : "로그인 링크 받기"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-gray-600 text-xs">또는</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      <button
        onClick={async () => {
          setLoading(true);
          setError(null);
          const result = await signInAnonymously();
          if (result.error) {
            setError(result.error);
          }
          setLoading(false);
        }}
        disabled={loading}
        className={`w-full py-4 rounded-xl text-base font-semibold transition-all active:scale-95 ${
          loading
            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
            : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
        }`}
      >
        {loading ? "처리 중..." : "게스트로 시작하기"}
      </button>

      <p className="text-center text-gray-600 text-xs mt-5">
        게스트는 이 기기에서만 사용 가능합니다<br />
        이메일 로그인 시 다른 기기에서도 동기화됩니다
      </p>
    </div>
  );
}
