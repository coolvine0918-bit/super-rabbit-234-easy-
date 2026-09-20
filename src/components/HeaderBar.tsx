import React from 'react';
import { Volume2, VolumeX, Trophy, BookOpen, User, Sheet, Maximize } from 'lucide-react';

interface HeaderBarProps {
  score: number;
  quizScore: number;
  hp: number;
  maxHp: number;
  coins: number;
  solvedCount: number;
  totalQuizzes: number;
  studentName: string;
  studentId: string;
  streak: number;
  laserReady: boolean;
  laserTimeLeft?: number;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
  onOpenReview: () => void;
  onOpenProfile: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isSheetConfigured: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  score,
  quizScore,
  hp,
  maxHp,
  coins,
  solvedCount,
  totalQuizzes,
  studentName,
  studentId,
  streak,
  laserReady,
  laserTimeLeft = 0,
  onOpenSettings,
  onOpenLeaderboard,
  onOpenReview,
  onOpenProfile,
  soundEnabled,
  onToggleSound,
  isSheetConfigured,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  // Request browser full screen for immersive tablet landscape gaming
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="bg-sky-100/95 border-b-3 sm:border-b-4 border-gray-950 px-2 sm:px-5 py-1.5 sm:py-2.5 shadow-md select-none shrink-0 z-20">
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Left: Brand + Heart Gauge (Styled exactly like 1.jpg) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Heart Health Gauge */}
          <div className="flex items-center gap-1.5 bg-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
            <span className="text-rose-500 text-base sm:text-xl drop-shadow animate-pulse">❤️</span>
            {/* Health Meter Bar */}
            <div className="w-16 sm:w-28 h-3.5 sm:h-4.5 bg-gray-200 rounded-full border-2 border-gray-900 overflow-hidden relative">
              <div
                className="h-full bg-linear-to-r from-rose-500 to-red-500 transition-all duration-300"
                style={{ width: `${hpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] font-pixel text-gray-900 font-bold leading-none">
                {hp}/{maxHp}
              </span>
            </div>
          </div>

          {/* Student Profile Quick View */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-950 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border-2 border-gray-900 text-xs font-bold cursor-pointer transition-colors shadow-[2px_2px_0px_#111827] touch-manipulation"
            title="학생 정보 변경"
          >
            <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="max-w-[70px] sm:max-w-[120px] truncate">{studentName || '이름 입력'}</span>
            {studentId && <span className="text-purple-600 font-normal hidden lg:inline">({studentId})</span>}
          </button>
        </div>

        {/* Center: Coins & Score stats */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Coins */}
          <div className="flex items-center gap-1 bg-amber-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
            <span className="w-4 h-4 rounded-full bg-amber-400 border border-amber-600 flex items-center justify-center text-[10px] font-bold text-amber-900">
              🪙
            </span>
            <span className="font-pixel text-[11px] sm:text-xs md:text-sm text-gray-900 font-bold">
              ×{coins}
            </span>
          </div>

          {/* Quiz Solved Progress */}
          <div className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] ${
            solvedCount >= totalQuizzes
              ? 'bg-emerald-300 text-emerald-950 font-bold animate-pulse'
              : 'bg-emerald-50 text-emerald-950 font-bold'
          }`}>
            <span className="text-xs">{solvedCount >= totalQuizzes ? '🏆' : '📝'}</span>
            <span className="font-pixel text-[10px] sm:text-xs whitespace-nowrap">
              {solvedCount >= totalQuizzes ? '트로피 해금 완료! (20/20)' : `퀴즈 ${solvedCount}/${totalQuizzes}`}
            </span>
            {solvedCount < totalQuizzes && (
              <span className="text-[9px] text-rose-700 font-bold hidden md:inline">
                (20개 완료 필수)
              </span>
            )}
          </div>

          {/* Total Combined Score */}
          <div className="flex items-center gap-1 bg-yellow-300 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
            <span className="text-xs">⭐</span>
            <div className="flex items-baseline gap-1">
              <span className="font-pixel text-[11px] sm:text-xs md:text-sm text-gray-950 font-bold whitespace-nowrap">
                {score + quizScore}P
              </span>
              <span className="text-[9px] text-gray-700 hidden md:inline font-bold">
                (보너스 {quizScore})
              </span>
            </div>
          </div>

          {/* Super Laser Ready Badge with 15-second countdown */}
          {laserReady ? (
            <div className="flex items-center gap-1.5 bg-linear-to-r from-red-600 via-amber-500 to-yellow-400 text-white px-2.5 py-1 sm:py-1.5 rounded-xl border-2 border-gray-950 shadow-[2px_2px_0px_#111827] font-bold text-[10px] sm:text-xs animate-pulse">
              <span className="text-sm">⚡</span>
              <span className="whitespace-nowrap font-pixel">레이저 {laserTimeLeft}초 남음! [X키]</span>
            </div>
          ) : streak > 0 ? (
            <div className="hidden lg:flex items-center gap-1 bg-amber-100 text-amber-950 px-2 py-1 rounded-xl border border-amber-400 text-[11px] font-bold shadow-xs">
              <span>🔥</span>
              <span>{streak}/5 연속 정답 ({5 - streak}개 더 맞히면 15초 발동!)</span>
            </div>
          ) : null}
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 sm:p-2 bg-white hover:bg-gray-100 active:bg-gray-200 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] cursor-pointer text-gray-800 touch-manipulation"
            title={soundEnabled ? "효과음 끄기" : "효과음 켜기"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
          </button>

          {/* Fullscreen Toggle for Tablets */}
          <button
            onClick={handleToggleFullscreen}
            className="hidden sm:flex p-1.5 sm:p-2 bg-white hover:bg-gray-100 active:bg-gray-200 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] cursor-pointer text-gray-700 touch-manipulation"
            title="태블릿 전체화면 모드"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Leaderboard */}
          <button
            onClick={onOpenLeaderboard}
            className="p-1.5 sm:p-2 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] cursor-pointer text-amber-900 touch-manipulation"
            title="실시간 랭킹"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* 20 Questions Study List */}
          <button
            onClick={onOpenReview}
            className="p-1.5 sm:p-2 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] cursor-pointer text-blue-900 touch-manipulation"
            title="20문항 복습 & 학습노트"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Google Sheet Setup */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-xl border-2 border-gray-900 shadow-[2px_2px_0px_#111827] cursor-pointer text-xs font-bold transition-all touch-manipulation ${
              isSheetConfigured
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
            }`}
            title="구글 시트 연동 설정"
          >
            <Sheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSheetConfigured ? '시트 연동됨' : '시트 연동'}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
