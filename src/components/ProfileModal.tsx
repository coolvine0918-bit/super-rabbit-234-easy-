import React, { useState } from 'react';
import { User, Check, X } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
  onSave: (name: string, id: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentId,
  onSave,
}) => {
  const [name, setName] = useState(studentName);
  const [id, setId] = useState(studentId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name.trim(), id.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white pixel-box rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-purple-600 text-white px-5 py-3.5 border-b-4 border-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <User className="w-4 h-4 text-purple-200" />
            <span>학생 정보 설정</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm text-gray-800">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              학생 이름 (필수)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 홍길동"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-purple-600 focus:outline-hidden font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              학번 / 번호 (선택)
            </label>
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="예: 2학년 3반 15번"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-purple-600 focus:outline-hidden font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg border-2 border-gray-900 pixel-btn flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
