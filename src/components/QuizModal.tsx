import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';
import { QuizQuestion } from '../types';
import { Sparkles, CheckCircle2, XCircle, ArrowRight, BookOpen, Volume2 } from 'lucide-react';

interface QuizModalProps {
  question: QuizQuestion;
  onSolve: (questionId: number, isCorrect: boolean) => void;
  onClose: () => void;
  currentQuizIndex: number;
  totalQuizzes: number;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  question,
  onSolve,
  onClose,
  currentQuizIndex,
  totalQuizzes,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  const handleSelectOption = (opt: string) => {
    if (isSubmitted) return;
    setSelectedOption(opt);

    const correct = opt.trim() === question.answer.trim();
    setIsSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      sounds.playCorrect();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FBBF24', '#34D399', '#60A5FA', '#F472B6']
      });
      onSolve(question.id, true);
    } else {
      sounds.playWrong();
      onSolve(question.id, false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Container maximized for landscape tablet: wide, comfortable padding, 2-column options on landscape */}
      <div className="w-full max-w-4xl bg-white pixel-box rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* Pixel Header */}
        <div className="bg-purple-100 border-b-4 border-gray-900 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-purple-600 text-white font-pixel text-xs sm:text-sm px-3 py-1.5 rounded-md border-2 border-gray-900 shadow-[2px_2px_0px_#111827]">
              QUIZ #{question.id}
            </div>
            <span className="text-xs sm:text-sm font-bold text-purple-900 bg-purple-200/90 px-3 py-1 rounded-full border border-purple-300">
              {question.category}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-pixel text-xs sm:text-sm text-gray-800 font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-gray-300">
              진행: {currentQuizIndex} / {totalQuizzes}
            </span>
          </div>
        </div>

        {/* Question Body with landscape tablet scrolling if needed */}
        <div className="p-4 sm:p-6 md:p-7 overflow-y-auto flex-1 flex flex-col justify-center">
          
          {/* Question text box */}
          <div className="mb-4 sm:mb-5">
            <div className="text-xs sm:text-sm font-bold text-blue-600 tracking-wider mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>문제를 읽고 올바른 정답을 터치하세요!</span>
            </div>
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-950 leading-snug break-keep">
              {question.question}
            </h2>
          </div>

          {/* Options in a responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {question.options.map((opt, idx) => {
              const isThisSelected = selectedOption === opt;
              const isThisCorrect = opt.trim() === question.answer.trim();
              const isLastOdd = idx === question.options.length - 1 && question.options.length % 2 === 1;

              let btnStyle = "bg-purple-50 hover:bg-purple-100 border-gray-900 text-gray-900";
              let badgeColor = "bg-purple-200 text-purple-900";

              if (isSubmitted) {
                if (isThisCorrect) {
                  btnStyle = "bg-emerald-100 border-emerald-800 text-emerald-950 font-bold ring-3 ring-emerald-500";
                  badgeColor = "bg-emerald-500 text-white";
                } else if (isThisSelected && !isCorrect) {
                  btnStyle = "bg-rose-100 border-rose-800 text-rose-950 line-through opacity-85";
                  badgeColor = "bg-rose-500 text-white";
                } else {
                  btnStyle = "bg-gray-50 border-gray-300 text-gray-400 opacity-60";
                  badgeColor = "bg-gray-200 text-gray-500";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isSubmitted}
                  className={`w-full p-2.5 sm:p-3.5 rounded-xl text-left flex items-center justify-between border-3 transition-all pixel-btn min-h-[52px] sm:min-h-[58px] ${
                    isLastOdd ? 'sm:col-span-2' : ''
                  } ${btnStyle} ${
                    !isSubmitted ? 'cursor-pointer active:scale-[0.98] touch-manipulation' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg flex items-center justify-center font-pixel text-xs sm:text-sm font-bold border-2 border-gray-900 ${badgeColor}`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm sm:text-base md:text-lg font-bold leading-tight">
                      {opt}
                    </span>
                  </div>

                  {isSubmitted && isThisCorrect && (
                    <div className="flex items-center gap-1 text-emerald-800 font-bold text-xs sm:text-sm bg-white/90 px-2 py-1 rounded border border-emerald-400 shrink-0 ml-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>정답!</span>
                    </div>
                  )}
                  {isSubmitted && isThisSelected && !isCorrect && (
                    <div className="flex items-center gap-1 text-rose-800 font-bold text-xs sm:text-sm bg-white/90 px-2 py-1 rounded border border-rose-400 shrink-0 ml-2">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>오답</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Learning Explanation */}
          {isSubmitted && (
            <div className="mt-3.5 sm:mt-4 p-3.5 sm:p-4 rounded-xl border-2 border-gray-900 bg-amber-50 text-gray-900 text-xs sm:text-sm animate-in fade-in duration-150">
              <div className="flex items-center gap-2 mb-1 font-bold">
                {isCorrect ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    정답입니다! (+500 보너스 점수 & 체력 1 회복)
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1.5 text-xs sm:text-sm">
                    <XCircle className="w-4 h-4" />
                    오답입니다! 정답: <strong className="underline decoration-emerald-500 font-extrabold">{question.answer}</strong> (체력 -1 감소)
                  </span>
                )}
              </div>
              <p className="text-gray-800 leading-relaxed text-xs sm:text-sm">
                💡 <strong>핵심 개념:</strong> {question.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-100 border-t-3 border-gray-900 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-600 hidden sm:block">
            {isSubmitted ? "설명을 확인하고 모험을 이어가세요!" : "보기를 클릭하여 퀴즈를 해결하세요 (+500P)"}
          </div>

          {isSubmitted ? (
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-7 py-2.5 sm:py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-gray-950 font-bold rounded-xl border-3 border-gray-900 pixel-btn flex items-center justify-center gap-2 cursor-pointer ml-auto text-sm sm:text-base touch-manipulation"
            >
              <span>계속 모험하기</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <div className="text-xs sm:text-sm font-bold text-purple-700 flex items-center gap-1">
              <span>보너스 획득 기회: +500점</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
