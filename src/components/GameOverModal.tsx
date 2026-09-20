import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Send, CheckCircle2, AlertCircle, Sparkles, Clock, BookOpen, Star } from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameOverModalProps {
  won: boolean;
  score: number;
  quizScore: number;
  coins: number;
  solvedCount: number;
  totalQuizzes: number;
  timeTaken: number;
  studentName: string;
  studentId: string;
  appsScriptUrl: string;
  onRestart: () => void;
  onOpenSheetSetup: () => void;
}

const BAKED_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxbFUdGc7KsarlD6SNzK34xA4gRehyFLfSZhgSUDC-i-C0J5Ll-J1g5vkaGg_et6SNZJA/exec';

export const GameOverModal: React.FC<GameOverModalProps> = ({
  won,
  score,
  quizScore,
  coins,
  solvedCount,
  totalQuizzes,
  timeTaken,
  studentName,
  studentId,
  appsScriptUrl,
  onRestart,
  onOpenSheetSetup,
}) => {
  const [name, setName] = useState(studentName || '토끼 대원');
  const [stuId, setStuId] = useState(studentId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; sheetSynced: boolean } | null>(null);

  const totalScore = score + quizScore;
  const accuracy = totalQuizzes > 0 ? Math.round((solvedCount / totalQuizzes) * 100) : 0;
  const effectiveUrl = (appsScriptUrl && appsScriptUrl.trim()) ? appsScriptUrl.trim() : BAKED_APPS_SCRIPT_URL;

  const handleSubmitScore = async (overrideName?: string, overrideStuId?: string) => {
    const finalName = (overrideName ?? name).trim() || '토끼 대원';
    const finalStuId = (overrideStuId ?? stuId).trim();

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const payload = {
        studentName: finalName,
        studentId: finalStuId,
        quizScore,
        gameScore: score,
        totalScore,
        correctCount: solvedCount,
        totalQuestions: totalQuizzes,
        cleared: won,
        timeTaken,
        appsScriptUrl: effectiveUrl,
      };

      const res = await fetch('/api/record-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSubmitResult({
        success: data.success,
        message: data.message || '성적이 등록되었습니다!',
        sheetSynced: !!data.googleSheetSynced,
      });

      if (data.success) {
        sounds.playCoin();
        confetti({
          particleCount: 80,
          spread: 85,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      setSubmitResult({
        success: false,
        message: '저장 실패: ' + (err.message || '네트워크 오류'),
        sheetSynced: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Automatically record score to Google Sheet ONLY IF WON (완주한 학생만 집계)
  useEffect(() => {
    if (won) {
      handleSubmitScore();
    }
  }, [won]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white pixel-box rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* Banner Header */}
        <div
          className={`px-5 py-4 sm:py-5 border-b-4 border-gray-900 text-center ${
            won
              ? 'bg-linear-to-b from-amber-300 to-amber-400 text-amber-950'
              : 'bg-linear-to-b from-slate-700 to-slate-800 text-white'
          }`}
        >
          <div className="text-3xl sm:text-4xl mb-1">
            {won ? '🏆' : '💀'}
          </div>
          <h2 className="font-pixel text-base sm:text-xl font-bold tracking-tight">
            {won ? 'STAGE CLEAR! 대모험 완주 성공!' : 'GAME OVER (다시 도전해보세요!)'}
          </h2>
          <p className="text-xs sm:text-sm mt-0.5 opacity-90 font-medium">
            {won
              ? '노동권 20문항 대모험을 멋지게 통과했습니다!'
              : '체력이 다했습니다. 개념을 복습하고 다시 도전해보세요!'}
          </p>
        </div>

        {/* Score & Stats Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-amber-50 border-2 border-amber-300 p-2.5 sm:p-3 rounded-xl text-center">
              <span className="text-[11px] sm:text-xs text-amber-800 font-bold block">총 점수</span>
              <span className="font-pixel text-base sm:text-lg font-bold text-amber-950">
                {totalScore.toLocaleString()}P
              </span>
            </div>
            <div className="bg-purple-50 border-2 border-purple-300 p-2.5 sm:p-3 rounded-xl text-center">
              <span className="text-[11px] sm:text-xs text-purple-800 font-bold block">퀴즈 보너스</span>
              <span className="font-pixel text-base sm:text-lg font-bold text-purple-950">
                {quizScore.toLocaleString()}P
              </span>
            </div>
            <div className="bg-emerald-50 border-2 border-emerald-300 p-2.5 sm:p-3 rounded-xl text-center">
              <span className="text-[11px] sm:text-xs text-emerald-800 font-bold block">정답률</span>
              <span className="font-pixel text-base sm:text-lg font-bold text-emerald-950">
                {accuracy}%
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-700 font-bold block">({solvedCount}/{totalQuizzes}문항)</span>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 p-2.5 sm:p-3 rounded-xl text-center">
              <span className="text-[11px] sm:text-xs text-blue-800 font-bold block">소요 시간</span>
              <span className="font-pixel text-base sm:text-lg font-bold text-blue-950">
                {timeTaken}초
              </span>
            </div>
          </div>

          {/* Student Info & Submission Box optimized for touch screen */}
          {won ? (
            <div className="bg-gray-50 border-2 border-gray-800 rounded-xl p-3.5 sm:p-4 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span>📝 구글 시트 자동 성적 집계 (완주 성공)</span>
                </h3>
                <span className="text-emerald-700 text-[11px] sm:text-xs font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  ✓ 완주자 실시간 자동 집계
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    학번 (예: 2026-01)
                  </label>
                  <input
                    type="text"
                    value={stuId}
                    onChange={e => setStuId(e.target.value)}
                    placeholder="학번 입력"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    학생 이름 (필수)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="이름 입력"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSubmitScore()}
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl border-2 border-gray-900 pixel-btn flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs sm:text-sm touch-manipulation"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? '구글 시트로 성적 전송 중...'
                    : submitResult?.success
                    ? '성적 정보 수정 후 다시 제출하기'
                    : '구글 시트 및 랭킹에 성적 제출하기'}
                </span>
              </button>

              {/* Submit Response Feedback */}
              {submitResult && (
                <div
                  className={`p-3 rounded-lg border text-xs sm:text-sm flex items-start gap-2 ${
                    submitResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                      : 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
                  }`}
                >
                  {submitResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{submitResult.message}</p>
                    {submitResult.sheetSynced && (
                      <p className="text-xs text-emerald-700 font-bold mt-0.5">
                        ✓ 구글 스프레드시트에 실시간 새 행으로 추가되었습니다!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>구글 시트 집계 안내 (완주자 한정)</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                구글 스프레드시트에는 <strong>끝까지 완주(STAGE CLEAR)한 학생의 기록만 자동 집계</strong>됩니다. 체력을 조절하며 장애물을 피하고 결승선 깃발까지 완주해 보세요!
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t-3 border-gray-900 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={onRestart}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-gray-950 font-bold rounded-xl border-3 border-gray-900 pixel-btn flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base touch-manipulation"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>게임 다시 시작하기</span>
          </button>
        </div>

      </div>
    </div>
  );
};
