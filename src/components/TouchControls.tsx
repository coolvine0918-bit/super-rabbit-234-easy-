import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  ChevronUp, 
  Sliders, 
  Eye, 
  EyeOff,
  Maximize2,
  Zap
} from 'lucide-react';

interface TouchControlsProps {
  onKeyChange: (key: 'left' | 'right' | 'up' | 'down' | 'jump' | 'shoot', active: boolean) => void;
  laserReady?: boolean;
  laserTimeLeft?: number;
  streak?: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onKeyChange,
  laserReady = false,
  laserTimeLeft = 0,
  streak = 0,
}) => {
  // Tablet customization settings stored in local state/session
  const [controlSize, setControlSize] = useState<'normal' | 'large' | 'compact'>('large'); // Default large for tablet
  const [opacity, setOpacity] = useState<number>(95);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  // Trigger brief subtle vibration on tablets that support navigator.vibrate
  const triggerHaptic = () => {
    if (hapticEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore if not supported
      }
    }
  };

  const bindTouch = (key: 'left' | 'right' | 'up' | 'down' | 'jump' | 'shoot') => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      triggerHaptic();
      onKeyChange(key, true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      onKeyChange(key, false);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      onKeyChange(key, false);
    },
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      triggerHaptic();
      onKeyChange(key, true);
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.preventDefault();
      onKeyChange(key, false);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      onKeyChange(key, false);
    },
  });

  // Size styling classes according to tablet settings
  const dpadButtonClass = 
    controlSize === 'large' 
      ? 'w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 text-base' 
      : controlSize === 'compact'
      ? 'w-12 h-12 sm:w-14 sm:h-14 text-xs'
      : 'w-14 h-14 sm:w-16 sm:h-16 text-sm';

  const centerButtonClass = 
    controlSize === 'large'
      ? 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18'
      : controlSize === 'compact'
      ? 'w-10 h-10 sm:w-12 sm:h-12'
      : 'w-12 h-12 sm:w-14 sm:h-14';

  const jumpButtonClass =
    controlSize === 'large'
      ? 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28'
      : controlSize === 'compact'
      ? 'w-16 h-16 sm:w-18 sm:h-18'
      : 'w-18 h-18 sm:w-20 sm:h-20';

  const opacityStyle = { opacity: opacity / 100 };

  return (
    <div 
      className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-30 select-none flex flex-col justify-end"
      style={opacityStyle}
    >
      {/* Quick floating toggle for tablet controllers customization */}
      <div className="absolute top-3 right-3 pointer-events-auto flex items-center gap-1.5 z-40">
        <button
          onClick={() => setControlsVisible(v => !v)}
          className="bg-gray-900/80 hover:bg-gray-900 text-white p-2 rounded-lg border-2 border-white/40 shadow-md cursor-pointer transition-transform active:scale-95"
          title={controlsVisible ? "컨트롤러 숨기기" : "컨트롤러 보이기"}
        >
          {controlsVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="bg-gray-900/80 hover:bg-gray-900 text-white p-2 rounded-lg border-2 border-white/40 shadow-md cursor-pointer transition-transform active:scale-95"
          title="태블릿 가로화면 컨트롤러 크기/투명도 조정"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Control Configuration Popover */}
      {showSettings && (
        <div className="absolute top-14 right-3 bg-white/95 backdrop-blur-md p-4 rounded-xl border-3 border-gray-900 shadow-2xl pointer-events-auto z-50 text-xs w-64 text-gray-900 space-y-3">
          <div className="font-bold flex items-center justify-between border-b pb-2">
            <span>태블릿 터치 조작 설정</span>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-900 cursor-pointer font-mono text-sm"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">버튼 크기 (태블릿 가로 최적화)</label>
            <div className="grid grid-cols-3 gap-1">
              {(['compact', 'normal', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setControlSize(size)}
                  className={`py-1.5 px-2 rounded-md font-bold text-center border cursor-pointer ${
                    controlSize === size 
                      ? 'bg-amber-400 text-gray-950 border-gray-900 shadow-[1px_1px_0px_#111827]' 
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {size === 'compact' ? '기본' : size === 'normal' ? '중간' : '태블릿(큼)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-gray-700">투명도 ({opacity}%)</label>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              value={opacity}
              onChange={e => setOpacity(Number(e.target.value))}
              className="w-full cursor-pointer accent-amber-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-gray-700">터치 진동 (햅틱)</span>
            <input
              type="checkbox"
              checked={hapticEnabled}
              onChange={e => setHapticEnabled(e.target.checked)}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Main Touch Controls Bar for Landscape Orientation */}
      {controlsVisible && (
        <div className="w-full pb-4 md:pb-6 px-4 sm:px-8 md:px-12 flex justify-between items-end">
          
          {/* ==================================================== */}
          {/* LEFT ZONE: Ergonomic Landscape D-Pad for Left Thumb */}
          {/* Designed for two-handed tablet grip                  */}
          {/* ==================================================== */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-gray-950/20 backdrop-blur-xs p-2 sm:p-3 rounded-3xl border-2 border-white/20 shadow-xl">
            
            {/* LEFT BUTTON (Big thumb touch target) */}
            <button
              {...bindTouch('left')}
              className={`${dpadButtonClass} bg-white active:bg-amber-300 text-gray-950 rounded-2xl border-3 sm:border-4 border-gray-950 shadow-[3px_3px_0px_#111827] flex flex-col items-center justify-center active:scale-95 touch-manipulation cursor-pointer transition-transform`}
              aria-label="왼쪽 이동"
            >
              <ArrowLeft className="w-7 h-7 sm:w-9 sm:h-9 stroke-[3]" />
              <span className="font-pixel text-[9px] sm:text-[10px] font-bold mt-0.5 text-gray-700">LEFT</span>
            </button>

            {/* VERTICAL COLUMN: CLIMB UP & CLIMB DOWN FOR LADDERS */}
            <div className="flex flex-col gap-2">
              <button
                {...bindTouch('up')}
                className={`${centerButtonClass} bg-white active:bg-amber-300 text-gray-950 rounded-xl border-3 border-gray-950 shadow-[2px_2px_0px_#111827] flex flex-col items-center justify-center active:scale-95 touch-manipulation cursor-pointer transition-transform`}
                aria-label="사다리 위로 오르기"
              >
                <ArrowUp className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
                <span className="font-pixel text-[8px] font-bold text-gray-600">UP</span>
              </button>

              <button
                {...bindTouch('down')}
                className={`${centerButtonClass} bg-white active:bg-amber-300 text-gray-950 rounded-xl border-3 border-gray-950 shadow-[2px_2px_0px_#111827] flex flex-col items-center justify-center active:scale-95 touch-manipulation cursor-pointer transition-transform`}
                aria-label="사다리 아래로 내리기"
              >
                <ArrowDown className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
                <span className="font-pixel text-[8px] font-bold text-gray-600">DOWN</span>
              </button>
            </div>

            {/* RIGHT BUTTON (Big thumb touch target) */}
            <button
              {...bindTouch('right')}
              className={`${dpadButtonClass} bg-white active:bg-amber-300 text-gray-950 rounded-2xl border-3 sm:border-4 border-gray-950 shadow-[3px_3px_0px_#111827] flex flex-col items-center justify-center active:scale-95 touch-manipulation cursor-pointer transition-transform`}
              aria-label="오른쪽 이동"
            >
              <ArrowRight className="w-7 h-7 sm:w-9 sm:h-9 stroke-[3]" />
              <span className="font-pixel text-[9px] sm:text-[10px] font-bold mt-0.5 text-gray-700">RIGHT</span>
            </button>
          </div>

          {/* ==================================================== */}
          {/* RIGHT ZONE: Ergonomic Jump & Action for Right Thumb  */}
          {/* Generous hit area and arcade styling                */}
          {/* ==================================================== */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-gray-950/20 backdrop-blur-xs p-2 sm:p-3 rounded-full border-2 border-white/20 shadow-xl">
            {/* SUPER LASER BUTTON (15-second duration once unlocked) */}
            {laserReady ? (
              <button
                {...bindTouch('shoot')}
                className={`${centerButtonClass} bg-linear-to-b from-rose-500 via-amber-500 to-red-600 active:from-red-600 active:to-amber-600 text-white rounded-full border-3 sm:border-4 border-gray-950 shadow-[3px_4px_0px_#111827] flex flex-col items-center justify-center active:scale-90 touch-manipulation cursor-pointer transition-transform animate-pulse`}
                aria-label="슈퍼 레이저 발사"
                title={`슈퍼 레이저 발사 (${laserTimeLeft}초 남음)`}
              >
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-300 stroke-yellow-100 drop-shadow" />
                <span className="font-pixel text-[8px] sm:text-[9px] font-extrabold text-white leading-none mt-0.5">
                  {laserTimeLeft}s
                </span>
              </button>
            ) : (
              <div
                className={`${centerButtonClass} bg-gray-800/80 text-gray-400 rounded-full border-2 border-gray-600 shadow-[2px_2px_0px_#111827] flex flex-col items-center justify-center select-none opacity-60`}
                title="연속 5문제 정답 시 15초간 슈퍼 레이저 발동!"
              >
                <Zap className="w-4 h-4 text-gray-400" />
                <span className="text-[7px] font-bold text-gray-300">{streak}/5</span>
              </div>
            )}

            {/* JUMP BUTTON */}
            <button
              {...bindTouch('jump')}
              className={`${jumpButtonClass} bg-linear-to-b from-amber-300 to-amber-400 active:from-amber-400 active:to-amber-500 rounded-full border-4 sm:border-5 border-gray-950 shadow-[4px_5px_0px_#111827] flex flex-col items-center justify-center text-gray-950 active:scale-95 touch-manipulation cursor-pointer transition-transform`}
              aria-label="점프 버튼"
            >
              <ChevronUp className="w-8 h-8 sm:w-11 sm:h-11 md:w-13 md:h-13 stroke-[3.5] -mb-1" />
              <span className="font-pixel text-[11px] sm:text-[13px] md:text-[14px] font-extrabold tracking-wider text-amber-950">
                JUMP
              </span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
