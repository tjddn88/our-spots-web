'use client';

import { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title?: string;
  isLoading?: boolean;
  error?: string;
}

export default function PasswordModal({
  isOpen,
  onClose,
  onConfirm,
  title = '비밀번호 확인',
  isLoading = false,
  error
}: PasswordModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onConfirm(password);
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-72 p-4">
        <h3 className="text-lg font-bold mb-4">{title}</h3>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            autoFocus
            disabled={isLoading}
          />

          {error && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 py-2 px-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 py-2 px-3 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? '확인 중...' : '확인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
