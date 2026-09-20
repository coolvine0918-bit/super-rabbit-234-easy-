/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HeaderBar } from './components/HeaderBar';
import { QuizModal } from './components/QuizModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ReviewModal } from './components/ReviewModal';
import { ProfileModal } from './components/ProfileModal';
import { GameOverModal } from './components/GameOverModal';
import { TouchControls } from './components/TouchControls';
import { QUIZ_QUESTIONS } from './data/quizData';
import { sounds } from './utils/audio';
import { Play, Sparkles, Trophy, BookOpen, Sheet, HelpCircle, User, ShieldCheck, Tablet } from 'lucide-react';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxbFUdGc7KsarlD6SNzK34xA4gRehyFLfSZhgSUDC-i-C0J5Ll-J1g5vkaGg_et6SNZJA/exec';

export default function App() {
  // Game states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [hp, setHp] = useState<number>(5);
  const maxHp = 5;

  // Quiz states
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [solvedQuestions, setSolvedQuestions] = useState<Set<number>>(new Set());
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [laserTimeLeft, setLaserTimeLeft] = useState<number>(0);
  const [showLaserUnlockedBanner, setShowLaserUnlockedBanner] = useState<boolean>(false);

  // Modals
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Sound
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Student info & Google Sheet URL
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('rabbit_student_name') || '토끼 대원';
  });
  const [studentId, setStudentId] = useState<string>(() => {
    return localStorage.getItem('rabbit_student_id') || '';
  });
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    const stored = localStorage.getItem('rabbit_apps_script_url');
    if (!stored || stored.includes('AKfycbyth') || !stored.trim()) {
      return DEFAULT_APPS_SCRIPT_URL;
    }
    return stored;
  });

  // Ensure updated default URL is saved to localStorage
  useEffect(() => {
    const stored = localStorage.getItem('rabbit_apps_script_url');
    if (!stored || stored.includes('AKfycbyth') || !stored.trim()) {
      localStorage.setItem('rabbit_apps_script_url', DEFAULT_APPS_SCRIPT_URL);
      setAppsScriptUrl(DEFAULT_APPS_SCRIPT_URL);
    }
  }, []);

  // Timer
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // Virtual keys for touch
  const [virtualKeys, setVirtualKeys] = useState({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false,
  });

  // Save student credentials to localStorage
  const handleSaveProfile = (name: string, id: string) => {
    setStudentName(name);
    setStudentId(id);
    localStorage.setItem('rabbit_student_name', name);
    localStorage.setItem('rabbit_student_id', id);
  };

  // Save Apps Script URL to localStorage
  const handleSaveAppsScriptUrl = (url: string) => {
    setAppsScriptUrl(url);
    localStorage.setItem('rabbit_apps_script_url', url);
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  // Start / Restart game
  const handleStartGame = () => {
    setIsPlaying(true);
    setScore(0);
    setQuizScore(0);
    setCoins(0);
    setHp(maxHp);
    setSolvedQuestions(new Set());
    setCorrectCount(0);
    setStreak(0);
    setLaserTimeLeft(0);
    setShowLaserUnlockedBanner(false);
    setActiveQuestionId(null);
    setIsGameOverModalOpen(false);
    setTimeTaken(0);
    sounds.playCoin();
  };

  // Timer effect for game play time
  useEffect(() => {
    if (isPlaying && !activeQuestionId && !isGameOverModalOpen) {
      timerRef.current = window.setInterval(() => {
        setTimeTaken(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeQuestionId, isGameOverModalOpen]);

  // 15-second countdown timer for Super Laser Mode
  useEffect(() => {
    if (laserTimeLeft <= 0) return;
    if (!isPlaying || activeQuestionId !== null || isGameOverModalOpen) return;

    const interval = window.setInterval(() => {
      setLaserTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [laserTimeLeft, isPlaying, activeQuestionId, isGameOverModalOpen]);

  // Trigger Quiz Block
  const handleTriggerQuiz = useCallback((qId: number) => {
    if (!solvedQuestions.has(qId)) {
      setActiveQuestionId(qId);
    }
  }, [solvedQuestions]);

  // Answer Quiz
  const handleSolveQuiz = useCallback((qId: number, isCorrect: boolean) => {
    setSolvedQuestions(prev => {
      const next = new Set(prev);
      next.add(qId);
      return next;
    });

    if (isCorrect) {
      setQuizScore(s => s + 500); // +500 bonus points
      setCorrectCount(c => c + 1);
      setHp(h => Math.min(maxHp, h + 1)); // Heal 1 heart
      setStreak(s => {
        const nextStreak = s + 1;
        if (nextStreak === 5) {
          sounds.playSuperMode();
          setLaserTimeLeft(15); // Exactly 15 seconds limit!
          setShowLaserUnlockedBanner(true);
          setTimeout(() => setShowLaserUnlockedBanner(false), 4500);
          return 0; // Reset streak so students can build another 5 streak to unlock again!
        }
        return nextStreak;
      });
    } else {
      setHp(h => {
        const nextHp = h - 1;
        return Math.max(0, nextHp);
      });
      setStreak(0); // Reset streak on wrong answer
      setShowLaserUnlockedBanner(false);
    }
  }, []);

  const handleCloseQuiz = useCallback(() => {
    setActiveQuestionId(null);
    if (hp <= 0) {
      setGameWon(false);
      setIsGameOverModalOpen(true);
    }
  }, [hp]);

  // Game over / Stage clear
  const handleGameOver = useCallback((won: boolean) => {
    setGameWon(won);
    setIsGameOverModalOpen(true);
    setIsPlaying(false);
  }, []);

  // Touch controls callback
  const handleKeyChange = useCallback((key: 'left' | 'right' | 'up' | 'down' | 'jump' | 'shoot', active: boolean) => {
    setVirtualKeys(prev => ({ ...prev, [key]: active }));
  }, []);

  const currentQuizObj = activeQuestionId
    ? QUIZ_QUESTIONS.find(q => q.id === activeQuestionId) || null
    : null;

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-sky-200 text-gray-900 font-sans select-none touch-none">
      
      {/* Top Arcade Status Bar */}
      <HeaderBar
        score={score}
        quizScore={quizScore}
        hp={hp}
        maxHp={maxHp}
        coins={coins}
        solvedCount={solvedQuestions.size}
        totalQuizzes={QUIZ_QUESTIONS.length}
        studentName={studentName}
        studentId={studentId}
        streak={streak}
        laserReady={laserTimeLeft > 0}
        laserTimeLeft={laserTimeLeft}
        onOpenSettings={() => setIsSheetModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenReview={() => setIsReviewModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        isSheetConfigured={!!appsScriptUrl}
      />

      {/* Main Game Stage Area */}
      <main className="flex-1 relative overflow-hidden flex items-center justify-center bg-sky-300">
        {/* Floating Celebratory Banner when 5-streak laser is unlocked */}
        {showLaserUnlockedBanner && (
          <div className="absolute top-4 z-40 animate-bounce pointer-events-none px-4 py-2 bg-linear-to-r from-red-600 via-amber-500 to-yellow-400 text-white rounded-2xl border-3 border-gray-950 shadow-2xl flex items-center gap-2 font-pixel text-xs sm:text-sm">
            <span>⚡🔥</span>
            <span>5연속 정답! 슈퍼 토끼 레이저 15초 발동! (적들을 무찌르세요!)</span>
            <span>🔥⚡</span>
          </div>
        )}
        
        {/* Canvas Platformer */}
        <GameCanvas
          onTriggerQuiz={handleTriggerQuiz}
          onGameOver={handleGameOver}
          score={score}
          setScore={setScore}
          hp={hp}
          setHp={setHp}
          coins={coins}
          setCoins={setCoins}
          solvedQuestions={solvedQuestions}
          totalQuizzes={QUIZ_QUESTIONS.length}
          isQuizActive={activeQuestionId !== null}
          laserReady={laserTimeLeft > 0}
          laserTimeLeft={laserTimeLeft}
          virtualKeys={virtualKeys}
        />

        {/* Start Game Hero Overlay (Optimized for Tablet Landscape) */}
        {!isPlaying && !isGameOverModalOpen && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-xs p-3 sm:p-6">
            <div className="w-full max-w-2xl bg-sky-100 pixel-box rounded-2xl p-5 sm:p-7 text-center shadow-2xl relative overflow-hidden border-4 border-gray-900 max-h-[95vh] flex flex-col justify-between">
              
              <div>
                {/* Retro Title Box */}
                <div className="inline-block bg-purple-200 pixel-box px-5 py-2.5 sm:py-3.5 rounded-xl mb-3 shadow-[4px_4px_0px_#111827]">
                  <div className="font-pixel text-base sm:text-2xl font-bold text-gray-950 tracking-wider">
                    슈퍼토끼 런
                  </div>
                  <div className="font-pixel text-xs sm:text-base text-purple-900 font-bold mt-0.5 sm:mt-1">
                    노동권 퀴즈 QUIZ (태블릿 가로 에디션)
                  </div>
                </div>

                {/* Pixel Art Rabbit & Props Showcase */}
                <div className="flex items-center justify-center gap-5 my-2 text-2xl sm:text-3xl">
                  <span className="animate-bounce">🪜</span>
                  <span className="scale-125">🐰</span>
                  <span className="animate-spin text-amber-500">🪙</span>
                  <span>⭐</span>
                  <span>🏆</span>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed max-w-lg mx-auto mb-3">
                  양손 태블릿 가로 그립에 최적화되었습니다. 왼손으로 이동/사다리를 조작하고, 오른손으로 <strong>[JUMP]</strong>를 누르세요! 맵 곳곳의 <strong>[?] 블록 20문제를 모두 풀어야만</strong> 정상의 황금 트로피 🏆를 열고 스테이지를 클리어할 수 있습니다!
                </p>
              </div>

              {/* Student Name & Student ID Inputs */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border-2 border-gray-900 mb-3 text-left shadow-[2px_2px_0px_#111827]">
                <div className="text-[11px] sm:text-xs font-bold text-gray-600 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    학생 정보 입력 (선생님 구글 시트에 실시간 자동 기록)
                  </span>
                  {appsScriptUrl && (
                    <span className="text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-300">
                      ✓ 시트 연동 준비됨
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={studentId}
                    onChange={e => handleSaveProfile(studentName, e.target.value)}
                    placeholder="학번 (선택, 예: 2026-01)"
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:border-purple-600 focus:outline-hidden font-mono"
                  />
                  <input
                    type="text"
                    value={studentName}
                    onChange={e => handleSaveProfile(e.target.value, studentId)}
                    placeholder="학생 이름 (필수)"
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm focus:border-purple-600 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleStartGame}
                  className="w-full py-3 sm:py-3.5 px-6 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-gray-950 font-bold text-sm sm:text-base rounded-xl border-3 border-gray-900 pixel-btn flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_#111827] touch-manipulation"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>게임 시작 (START GAME)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex-1 py-2 sm:py-2.5 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-900 font-bold text-xs sm:text-sm rounded-xl border-2 border-gray-900 cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>20문항 복습하기</span>
                  </button>
                  <button
                    onClick={() => setIsSheetModalOpen(true)}
                    className="flex-1 py-2 sm:py-2.5 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 text-emerald-900 font-bold text-xs sm:text-sm rounded-xl border-2 border-gray-900 cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
                  >
                    <Sheet className="w-4 h-4" />
                    <span>구글 시트 연동 설정</span>
                  </button>
                </div>
              </div>

              {/* Tablet Controls Guide */}
              <div className="mt-2.5 pt-2 border-t border-gray-300 text-[11px] sm:text-xs text-gray-600 flex flex-wrap items-center justify-center gap-2 sm:gap-3 font-mono">
                <span className="flex items-center gap-1 font-bold text-purple-900">
                  <Tablet className="w-3.5 h-3.5" /> [왼손] 이동/사다리
                </span>
                <span>•</span>
                <span className="font-bold text-amber-900">[오른손] 점프(JUMP)</span>
                <span>•</span>
                <span className="font-bold text-rose-700">[⚡레이저] 5연속 정답 시 15초 발동 (X키/⚡버튼)</span>
                <span>•</span>
                <span className="text-gray-500">키보드: [←][→][↑][↓] [Space] [X/F:레이저]</span>
              </div>

            </div>
          </div>
        )}

        {/* On-screen touch controls optimized for tablet landscape */}
        {isPlaying && (
          <TouchControls 
            onKeyChange={handleKeyChange} 
            laserReady={laserTimeLeft > 0}
            laserTimeLeft={laserTimeLeft}
            streak={streak}
          />
        )}

        {/* Quiz Popup Modal (When rabbit touches [?] block) */}
        {currentQuizObj && (
          <QuizModal
            question={currentQuizObj}
            onSolve={handleSolveQuiz}
            onClose={handleCloseQuiz}
            currentQuizIndex={solvedQuestions.size + 1}
            totalQuizzes={QUIZ_QUESTIONS.length}
          />
        )}

        {/* Game Over / Stage Clear Result Modal */}
        {isGameOverModalOpen && (
          <GameOverModal
            won={gameWon}
            score={score}
            quizScore={quizScore}
            coins={coins}
            solvedCount={correctCount}
            totalQuizzes={QUIZ_QUESTIONS.length}
            timeTaken={timeTaken}
            studentName={studentName}
            studentId={studentId}
            appsScriptUrl={appsScriptUrl}
            onRestart={handleStartGame}
            onOpenSheetSetup={() => setIsSheetModalOpen(true)}
          />
        )}

        {/* Google Sheet Integration Modal */}
        <GoogleSheetModal
          isOpen={isSheetModalOpen}
          onClose={() => setIsSheetModalOpen(false)}
          appsScriptUrl={appsScriptUrl}
          onSaveUrl={handleSaveAppsScriptUrl}
        />

        {/* Leaderboard Modal */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
        />

        {/* 20 Questions Study & Review Modal */}
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />

        {/* Student Profile Modal */}
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          studentName={studentName}
          studentId={studentId}
          onSave={handleSaveProfile}
        />

      </main>

    </div>
  );
}
