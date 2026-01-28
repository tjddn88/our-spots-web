'use client';

import { useState, useRef, useEffect } from 'react';
import { PlaceType } from '@/types';

interface FilterButtonsProps {
  selected: PlaceType | null;
  onChange: (type: PlaceType | null) => void;
  selectedGrades: Set<number>;
  onGradeChange: (grades: Set<number>) => void;
}

const FILTERS: { type: PlaceType | null; label: string; emoji: string }[] = [
  { type: null, label: '전체', emoji: '📍' },
  { type: 'RESTAURANT', label: '맛집', emoji: '🍽️' },
  { type: 'KIDS_PLAYGROUND', label: '아이 놀이터', emoji: '🎠' },
  { type: 'RELAXATION', label: '아빠의 시간', emoji: '☕' },
];

const GRADES = [
  { grade: 1, label: '최애' },
  { grade: 2, label: '추천' },
  { grade: 3, label: '무난' },
];

export default function FilterButtons({ selected, onChange, selectedGrades, onGradeChange }: FilterButtonsProps) {
  const [showGradeMenu, setShowGradeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowGradeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleGrade = (grade: number) => {
    const newGrades = new Set(selectedGrades);
    if (newGrades.has(grade)) {
      newGrades.delete(grade);
    } else {
      newGrades.add(grade);
    }
    onGradeChange(newGrades);
  };

  const getGradeLabel = () => {
    if (selectedGrades.size === 3) return '전체';
    if (selectedGrades.size === 0) return '없음';
    return GRADES.filter(g => selectedGrades.has(g.grade)).map(g => g.label).join(', ');
  };

  // 필터가 기본값(1,2)이 아닌지 확인
  const isFiltered = selectedGrades.size < 3;

  return (
    <div className="flex items-center relative">
      {/* 스크롤 가능한 카테고리 칩 영역 */}
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pr-14 py-1">
          {FILTERS.map(({ type, label, emoji }) => (
            <button
              key={type ?? 'all'}
              onClick={() => onChange(type)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0
                ${
                  selected === type
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                }
              `}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* 그라데이션 + 구분선 + 필터 버튼 (우측 고정) */}
      <div className="absolute right-0 flex items-center h-full">
        {/* 그라데이션 페이드 */}
        <div className="w-12 h-full bg-gradient-to-r from-transparent to-white pointer-events-none" />

        {/* 구분선 */}
        <div className="w-px h-5 bg-gray-300" />

        {/* 필터 버튼 */}
        <div ref={menuRef} className="relative bg-white pl-2">
          <button
            onClick={() => setShowGradeMenu(!showGradeMenu)}
            className={`
              relative p-2 rounded-full transition-all flex-shrink-0 flex items-center justify-center
              ${showGradeMenu
                ? 'bg-gray-100 shadow-lg'
                : 'bg-white hover:bg-gray-100 shadow border border-gray-200'
              }
            `}
          >
            <svg
              className="w-4 h-4"
              fill={isFiltered ? '#6B7280' : 'none'}
              stroke="#6B7280"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {isFiltered && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
            )}
          </button>

          {/* 드롭다운 메뉴 */}
          {showGradeMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border p-2 z-50 min-w-[120px]">
              <div className="text-xs text-gray-500 px-2 py-1 font-medium">등급 필터</div>
              {GRADES.map(({ grade, label }) => (
                <label
                  key={grade}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedGrades.has(grade)}
                    onChange={() => toggleGrade(grade)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm whitespace-nowrap">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
