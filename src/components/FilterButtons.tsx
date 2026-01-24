'use client';

import { PlaceType } from '@/types';

interface FilterButtonsProps {
  selected: PlaceType | null;
  onChange: (type: PlaceType | null) => void;
}

const FILTERS: { type: PlaceType | null; label: string; emoji: string }[] = [
  { type: null, label: '전체', emoji: '📍' },
  { type: 'RESTAURANT', label: '맛집', emoji: '🍽️' },
  { type: 'KIDS_PLAYGROUND', label: '아이 놀이터', emoji: '🎠' },
  { type: 'RELAXATION', label: '아빠의 시간', emoji: '☕' },
];

export default function FilterButtons({ selected, onChange }: FilterButtonsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map(({ type, label, emoji }) => (
        <button
          key={type ?? 'all'}
          onClick={() => onChange(type)}
          className={`
            px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0
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
  );
}
