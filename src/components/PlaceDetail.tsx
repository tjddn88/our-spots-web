'use client';

import { PlaceDetail as PlaceDetailType, Rating } from '@/types';

interface PlaceDetailProps {
  place: PlaceDetailType | null;
  isLoading: boolean;
  onClose: () => void;
  position: { x: number; y: number } | null;
}

const RATING_CONFIG: Record<Rating, { label: string; color: string; emoji: string }> = {
  GOOD: { label: '맛있음', color: 'bg-green-100 text-green-800', emoji: '👍' },
  AVERAGE: { label: '보통', color: 'bg-yellow-100 text-yellow-800', emoji: '😐' },
  BAD: { label: '별로', color: 'bg-red-100 text-red-800', emoji: '👎' },
};

const TYPE_LABELS = {
  RESTAURANT: '맛집',
  KIDS_PLAYGROUND: '아이 놀이터',
  RELAXATION: '아빠의 쉼터',
};

// 타입별 등급 라벨 및 색상
const GRADE_CONFIG = {
  RESTAURANT: {
    1: { label: '🔥 찐맛집', color: 'bg-red-600 text-white' },
    2: { label: '👌 괜찮은 곳', color: 'bg-red-400 text-white' },
    3: { label: '🙂 무난한', color: 'bg-red-200 text-red-800' },
  },
  KIDS_PLAYGROUND: {
    1: { label: '⭐ 하민 최애', color: 'bg-pink-600 text-white' },
    2: { label: '👍 하민 추천', color: 'bg-pink-400 text-white' },
    3: { label: '🙂 무난한', color: 'bg-pink-200 text-pink-800' },
  },
  RELAXATION: {
    1: { label: '💎 인생 쉼터', color: 'bg-indigo-600 text-white' },
    2: { label: '👍 괜찮은 쉼터', color: 'bg-indigo-400 text-white' },
    3: { label: '🙂 무난한', color: 'bg-indigo-200 text-indigo-800' },
  },
} as const;

const getGradeLabel = (type: string, grade?: number) => {
  const config = GRADE_CONFIG[type as keyof typeof GRADE_CONFIG];
  if (config && grade && config[grade as keyof typeof config]) {
    return config[grade as keyof typeof config];
  }
  return { label: TYPE_LABELS[type as keyof typeof TYPE_LABELS] || '장소', color: 'bg-gray-100 text-gray-800' };
};

export default function PlaceDetail({ place, isLoading, onClose, position }: PlaceDetailProps) {
  if ((!place && !isLoading) || !position) return null;

  // 화면 경계를 벗어나지 않도록 조정
  const adjustedX = Math.min(position.x, window.innerWidth - 320);
  const adjustedY = Math.max(position.y, 80);

  return (
    <div
      className="fixed z-50 w-72 max-h-80"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-80">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isLoading ? (
              <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
            ) : (
              <>
                <span className="text-sm font-bold truncate">{place?.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  getGradeLabel(place?.type || '', place?.grade).color
                }`}>
                  {getGradeLabel(place?.type || '', place?.grade).label}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3 flex-1">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-3/4 bg-gray-200 animate-pulse rounded" />
            </div>
          ) : place ? (
            <div className="space-y-3">
              {/* Address */}
              <div className="flex items-start gap-1.5 text-xs text-gray-600">
                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{place.address}</span>
              </div>

              {/* Description */}
              {place.description && (
                <p className="text-xs text-gray-700">{place.description}</p>
              )}

              {/* Memos */}
              {place.memos.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-xs text-gray-900">
                    {place.type === 'RESTAURANT' ? '메뉴 평가' : '평가'}
                  </h3>
                  <div className="space-y-1.5">
                    {place.memos.map((memo) => {
                      const ratingConfig = RATING_CONFIG[memo.rating];
                      return (
                        <div
                          key={memo.id}
                          className="p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-medium text-xs">{memo.itemName}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${ratingConfig.color}`}>
                              {ratingConfig.emoji} {ratingConfig.label}
                            </span>
                          </div>
                          {memo.comment && (
                            <p className="text-xs text-gray-600">{memo.comment}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {place.memos.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  아직 등록된 메모가 없습니다
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
