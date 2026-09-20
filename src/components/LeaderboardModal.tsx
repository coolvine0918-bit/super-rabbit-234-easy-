import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, X, CheckCircle2, Award, Users } from 'lucide-react';
import { ScoreRecord } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [topScores, setTopScores] = useState<ScoreRecord[]>([]);
  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'top' | 'recent'>('top');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchScores = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      if (data.topScores) setTopScores(data.topScores);
      if (data.recentScores) setRecentScores(data.recentScores);
      if (typeof data.totalRecords === 'number') setTotalRecords(data.totalRecords);
      const now = new Date();
      setLastUpdated(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch {
      // ignore
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Initial fetch and 3-second live auto-polling when modal is open
  useEffect(() => {
    if (!isOpen) return;

    fetchScores(false);
    const interval = setInterval(() => {
      fetchScores(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentList = activeTab === 'top' ? topScores : recentScores;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-white pixel-box rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="bg-amber-400 border-b-4 border-gray-900 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-950" />
            <div>
              <h2 className="font-pixel text-sm sm:text-base text-gray-950 font-bold leading-tight">
                명예의 전당 (LEADERBOARD)
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-amber-950 font-medium">
                <span className="inline-flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  실시간 자동 집계 중
                </span>
                {lastUpdated && <span>• 갱신: {lastUpdated}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchScores(false)}
              title="지금 새로고침"
              className="p-1.5 hover:bg-amber-500 rounded-lg text-gray-950 cursor-pointer border border-amber-600/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-amber-500 rounded-lg text-gray-950 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher & Participant count */}
        <div className="flex items-center justify-between border-b-2 border-gray-900 bg-gray-100 p-2 gap-2">
          <div className="flex flex-1 gap-1.5">
            <button
              onClick={() => setActiveTab('top')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'top'
                  ? 'bg-amber-400 text-gray-950 border-2 border-gray-900 shadow-[2px_2px_0px_#111827]'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>학급 전체 랭킹순</span>
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'recent'
                  ? 'bg-amber-400 text-gray-950 border-2 border-gray-900 shadow-[2px_2px_0px_#111827]'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>최근 제출순</span>
            </button>
          </div>
          <div className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 shrink-0">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>총 {totalRecords}명 참여</span>
          </div>
        </div>

        {/* Score List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2">
          {currentList.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm space-y-1">
              <p className="font-bold text-gray-700">아직 제출된 점수가 없습니다.</p>
              <p className="text-xs text-gray-500">학생들이 완주하거나 성적을 제출하면 이 화면에 실시간으로 즉시 나타납니다!</p>
            </div>
          ) : (
            currentList.map((rec, idx) => (
              <div
                key={rec.id || idx}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border-2 transition-colors ${
                  idx === 0 && activeTab === 'top'
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                    : idx === 1 && activeTab === 'top'
                    ? 'border-slate-400 bg-slate-50/70'
                    : idx === 2 && activeTab === 'top'
                    ? 'border-amber-700/60 bg-orange-50/60'
                    : 'border-gray-800 bg-gray-50 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-pixel text-xs font-bold border shrink-0 ${
                      activeTab === 'top' && idx === 0
                        ? 'bg-amber-400 text-amber-950 border-amber-600 ring-2 ring-amber-300'
                        : activeTab === 'top' && idx === 1
                        ? 'bg-slate-200 text-slate-800 border-slate-400'
                        : activeTab === 'top' && idx === 2
                        ? 'bg-amber-700 text-white border-amber-900'
                        : 'bg-gray-200 text-gray-700 border-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm truncate">
                        {rec.studentName}
                      </span>
                      {rec.studentId && rec.studentId !== '-' && (
                        <span className="text-[11px] text-gray-500 font-mono bg-white px-1 rounded border border-gray-200">
                          {rec.studentId}
                        </span>
                      )}
                      {rec.cleared ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-300 shrink-0">
                          완주 성공 🏆
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                          도전
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                      <span>정답: {rec.correctCount}/20</span>
                      <span>•</span>
                      <span>{rec.timeTaken}초</span>
                      {rec.syncedToGoogleSheet && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 시트반영
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <div className="font-pixel text-sm sm:text-base font-bold text-amber-900">
                    {rec.totalScore.toLocaleString()}P
                  </div>
                  <div className="text-[10px] text-gray-400">
                    퀴즈 {rec.quizScore} + 게임 {rec.gameScore}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with instruction for classroom projector */}
        <div className="bg-gray-100 border-t-2 border-gray-800 p-2.5 px-4 flex items-center justify-between text-xs">
          <span className="text-gray-500 text-[11px]">
            * 3초마다 자동으로 순위가 갱신되므로 교실 화면(TV/프로젝터)에 띄워두고 사용하기 좋습니다.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0 ml-2"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
