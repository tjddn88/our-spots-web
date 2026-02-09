'use client';

import { useRef, useState, useCallback } from 'react';
import { SearchResultPlace } from '@/types';

interface SearchResultsPanelProps {
  results: SearchResultPlace[];
  keyword: string;
  onSelect: (result: SearchResultPlace) => void;
  onClose: () => void;
  headerHeight: number;
}

export default function SearchResultsPanel({
  results,
  keyword,
  onSelect,
  onClose,
  headerHeight,
}: SearchResultsPanelProps) {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY - translateY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [translateY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dy = e.clientY - startYRef.current;
    // 아래로만 드래그 가능 (위로는 제한)
    setTranslateY(Math.max(0, dy));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const sheetHeight = sheetRef.current?.offsetHeight || 0;
    if (translateY > sheetHeight * 0.8) {
      // 80% 이상 내리면 닫기
      onClose();
      setTranslateY(0);
    } else if (translateY < 15) {
      // 거의 안 움직였으면 원위치
      setTranslateY(0);
    }
    // 그 외에는 현재 위치 고정 (드래그한 만큼 내려간 상태 유지)
  }, [isDragging, translateY, onClose]);

  return (
    <>
      {/* 모바일: 하단 드래그 시트 */}
      <div
        ref={sheetRef}
        className="sm:hidden absolute bottom-0 left-0 right-0 z-20 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.15)] rounded-t-xl max-h-[45dvh] flex flex-col overflow-hidden"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {/* 드래그 핸들 */}
        <div
          className="flex justify-center pt-2.5 pb-1.5 shrink-0 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/80 shrink-0">
          <div className="text-xs text-gray-700">
            현재 지도 내 <span className="font-bold text-blue-600">{keyword}</span> 검색결과
            <span className="text-gray-400 ml-1.5">장소 {results.length}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results list */}
        <div className="overflow-y-auto flex-1 touch-pan-y" style={{ overscrollBehavior: 'contain' }}>
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              검색 결과가 없습니다
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.label}
                onClick={() => onSelect(result)}
                className="w-full px-4 py-2.5 text-left hover:bg-blue-50 border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {result.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.category && <span className="text-gray-400">{result.category} · </span>}
                      {result.address}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 데스크탑: 왼쪽 패널 (헤더 바로 아래) */}
      <div
        className="hidden sm:flex absolute left-0 z-20 w-80 bg-white shadow-xl border-r flex-col rounded-br-lg"
        style={{
          top: `${headerHeight}px`,
          maxHeight: `calc(100dvh - ${headerHeight + 16}px)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 shrink-0">
          <div className="text-sm text-gray-700">
            현재 지도 내 <span className="font-bold text-blue-600">{keyword}</span> 검색결과
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Result count */}
        <div className="px-4 py-2 border-b text-xs text-gray-500 shrink-0">
          장소 {results.length}
        </div>

        {/* Results list */}
        <div className="overflow-y-auto flex-1">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              검색 결과가 없습니다
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.label}
                onClick={() => onSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {result.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.name}</div>
                    {result.category && (
                      <div className="text-xs text-gray-400 mt-0.5">{result.category}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1 truncate">{result.address}</div>
                    {result.phone && (
                      <div className="text-xs text-blue-500 mt-0.5">{result.phone}</div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
