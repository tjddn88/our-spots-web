'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GuestbookMessage } from '@/types';
import { guestbookApi } from '@/services/api';
import { CloseIcon } from '@/components/icons';

interface GuestbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuestbookModal({ isOpen, onClose }: GuestbookModalProps) {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await guestbookApi.getMessages();
      setMessages(data);
      setError(null);
      shouldAutoScroll.current = true;
    } catch {
      setError('메시지를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (!hasFetched.current) setIsLoading(true);
      fetchMessages();
      hasFetched.current = true;
    }
  }, [isOpen, fetchMessages]);

  useEffect(() => {
    if (shouldAutoScroll.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      shouldAutoScroll.current = false;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    try {
      setIsSending(true);
      setError(null);
      const newMessage = await guestbookApi.create({
        nickname: nickname.trim() || undefined,
        content: trimmedContent,
      });
      setMessages((prev) => [...prev, newMessage]);
      setContent('');
      shouldAutoScroll.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await guestbookApi.delete(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr + 'Z');
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;

    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed z-50 inset-0 flex items-center justify-center pt-28 pb-4 px-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(450px, calc(100dvh - 8rem))' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              방명록
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {isLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                불러오는 중...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                아직 메시지가 없습니다. 첫 방명록을 남겨보세요!
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="group">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {msg.nickname || '익명'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(msg.createdAt)}
                    </span>
                    {msg.deletable && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-1.5 text-xs text-red-500 bg-red-50">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 px-4 py-3 space-y-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="닉네임 (선택)"
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
            />
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 200))}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 남겨주세요"
                  className="w-full text-sm px-3 py-2 pr-14 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300">
                  {content.length}/200
                </span>
              </div>
              <button
                onClick={handleSend}
                disabled={!content.trim() || isSending}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {isSending ? '...' : '전송'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
