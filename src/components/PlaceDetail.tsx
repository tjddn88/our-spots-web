'use client';

import { useState } from 'react';
import { PlaceDetail as PlaceDetailType } from '@/types';

interface PlaceDetailProps {
  place: PlaceDetailType | null;
  isLoading: boolean;
  onClose: () => void;
  onEdit?: (place: PlaceDetailType) => void;
  onDelete?: (placeId: number) => Promise<void>;
  position: { x: number; y: number } | null;
  isAuthenticated: boolean;
}

const TYPE_LABELS = {
  RESTAURANT: { label: '맛집', emoji: '🍽️', color: 'bg-red-100 text-red-700' },
  KIDS_PLAYGROUND: { label: '아이 놀이터', emoji: '🎠', color: 'bg-emerald-100 text-emerald-700' },
  RELAXATION: { label: '아빠의 시간', emoji: '☕', color: 'bg-indigo-100 text-indigo-700' },
};

// 타입별 등급 라벨 및 색상
const GRADE_CONFIG = {
  RESTAURANT: {
    1: { label: '🔥 찐맛집', color: 'bg-red-600 text-white' },
    2: { label: '👌 괜찮은 곳', color: 'bg-red-400 text-white' },
    3: { label: '🙂 무난한', color: 'bg-red-200 text-red-800' },
  },
  KIDS_PLAYGROUND: {
    1: { label: '⭐ 하민 최애', color: 'bg-emerald-600 text-white' },
    2: { label: '👍 하민 추천', color: 'bg-emerald-400 text-white' },
    3: { label: '🙂 무난한', color: 'bg-emerald-200 text-emerald-800' },
  },
  RELAXATION: {
    1: { label: '⭐ 소중한 시간', color: 'bg-indigo-600 text-white' },
    2: { label: '👍 알찬 시간', color: 'bg-indigo-400 text-white' },
    3: { label: '🙂 무난한', color: 'bg-indigo-200 text-indigo-800' },
  },
} as const;

const getGradeLabel = (type: string, grade?: number) => {
  const config = GRADE_CONFIG[type as keyof typeof GRADE_CONFIG];
  if (config && grade && config[grade as keyof typeof config]) {
    return config[grade as keyof typeof config];
  }
  const typeConfig = TYPE_LABELS[type as keyof typeof TYPE_LABELS];
  return { label: typeConfig?.label || '장소', color: 'bg-gray-100 text-gray-800' };
};

export default function PlaceDetail({ place, isLoading, onClose, onEdit, onDelete, position, isAuthenticated }: PlaceDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    if (!place) return;
    onEdit?.(place);
  };

  const handleDelete = async () => {
    if (!place) return;
    if (!isAuthenticated) {
      alert('로그인 후 이용해주세요');
      return;
    }
    if (!window.confirm(`"${place.name}" 장소를 삭제하시겠습니까?`)) return;
    setIsDeleting(true);
    try {
      await onDelete?.(place.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다');
    } finally {
      setIsDeleting(false);
    }
  };

  if ((!place && !isLoading) || !position) return null;

  const panelWidth = 288; // w-72
  const panelHeight = 320; // max-h-80
  const headerHeight = 140; // 헤더 + 필터 영역
  const padding = 16;

  let adjustedX = position.x;
  let adjustedY = position.y;

  // 우측 경계 체크: 패널이 화면 밖으로 나가면 마커 왼쪽에 표시
  if (position.x + panelWidth + padding > window.innerWidth) {
    adjustedX = position.x - panelWidth - 50;
  }

  // 좌측 경계 체크
  if (adjustedX < padding) {
    adjustedX = padding;
  }

  // 하단 경계 체크: 패널이 화면 밖으로 나가면 위로 표시
  if (position.y + panelHeight + padding > window.innerHeight) {
    adjustedY = window.innerHeight - panelHeight - padding;
  }

  // 상단 경계 체크: 헤더 아래로
  if (adjustedY < headerHeight) {
    adjustedY = headerHeight;
  }

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
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            {isLoading ? (
              <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
            ) : (
              <>
                <span className="text-sm font-bold">{place?.name}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    TYPE_LABELS[place?.type as keyof typeof TYPE_LABELS]?.color
                  }`}>
                    {TYPE_LABELS[place?.type as keyof typeof TYPE_LABELS]?.emoji} {TYPE_LABELS[place?.type as keyof typeof TYPE_LABELS]?.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    getGradeLabel(place?.type || '', place?.grade).color
                  }`}>
                    {getGradeLabel(place?.type || '', place?.grade).label}
                  </span>
                </div>
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

              {/* Review Links */}
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-200 overflow-hidden">
                <a
                  href={place.googlePlaceId
                    ? `https://www.google.com/maps/place/?q=place_id:${place.googlePlaceId}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm">🔵</span>
                  <span className="text-xs font-medium text-blue-700">Google</span>
                  {place.googleRating && (
                    <div className="flex items-center gap-1 ml-1">
                      <span className="text-yellow-500 text-xs">★</span>
                      <span className="text-xs font-semibold text-gray-700">{place.googleRating.toFixed(1)}</span>
                      {place.googleRatingsTotal && (
                        <span className="text-[10px] text-gray-400">({place.googleRatingsTotal.toLocaleString()})</span>
                      )}
                    </div>
                  )}
                  <span className="text-[10px] text-blue-500 ml-auto">리뷰 →</span>
                </a>
                <a
                  href={`https://search.naver.com/search.naver?query=${encodeURIComponent(
                    place.address.split(' ').slice(0, 2).join(' ') + ' ' + place.name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm">🟢</span>
                  <span className="text-xs font-medium text-green-700">Naver</span>
                  <span className="text-[10px] text-green-500 ml-auto">검색 →</span>
                </a>
              </div>

              {/* Description */}
              {place.description ? (
                <p className="text-xs text-gray-700 py-2">
                  {place.description}
                </p>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">
                  등록된 설명이 없습니다
                </p>
              )}

              {/* Edit/Delete Buttons */}
              <div className="flex gap-2 pt-2 border-t mt-3">
                <button
                  onClick={handleEdit}
                  className="flex-1 py-1.5 px-3 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-1.5 px-3 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
