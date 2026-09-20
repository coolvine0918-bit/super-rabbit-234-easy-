import React, { useState } from 'react';
import { BookOpen, X, CheckCircle, Search, Filter } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizData';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');

  if (!isOpen) return null;

  const filtered = QUIZ_QUESTIONS.filter(q => {
    const matchesStage = selectedStage === 'all' || q.stage === selectedStage;
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-4xl bg-white pixel-box rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 border-b-4 border-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-200" />
            <div>
              <h2 className="font-bold text-sm sm:text-lg">노동권 & 근로기준법 20문항 총정리 학습노트</h2>
              <p className="text-[11px] sm:text-xs text-blue-100">게임 속 20문항의 정답과 핵심 해설을 미리 예습하거나 복습하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-blue-700 rounded-lg text-white/90 hover:text-white cursor-pointer touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 bg-gray-50 border-b-2 border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="문제 또는 정답 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer touch-manipulation ${
                selectedStage === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              전체 (20)
            </button>
            {[1, 2, 3, 4].map(stg => (
              <button
                key={stg}
                onClick={() => setSelectedStage(stg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer touch-manipulation ${
                  selectedStage === stg
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {stg}층 퀴즈
              </button>
            ))}
          </div>
        </div>

        {/* Questions List in 2 columns on tablet landscape */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(q => (
              <div
                key={q.id}
                className="p-3.5 sm:p-4 rounded-xl border-2 border-gray-800 bg-white hover:border-blue-500 transition-colors shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-pixel text-xs font-bold text-blue-600">
                      Q{q.id}.
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {q.category}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 leading-snug">
                    {q.question}
                  </h4>
                </div>

                <div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5 mb-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>정답: {q.answer}</span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-200">
                    💡 <strong>해설:</strong> {q.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t-2 border-gray-800 p-3 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer shadow-xs touch-manipulation"
          >
            학습 완료하고 게임으로 돌아가기
          </button>
        </div>

      </div>
    </div>
  );
};
