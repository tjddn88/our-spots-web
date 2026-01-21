'use client';

import { PlaceDetail as PlaceDetailType, Rating } from '@/types';

interface PlaceDetailProps {
  place: PlaceDetailType | null;
  isLoading: boolean;
  onClose: () => void;
}

const RATING_CONFIG: Record<Rating, { label: string; color: string; emoji: string }> = {
  GOOD: { label: '맛있음', color: 'bg-green-100 text-green-800', emoji: '👍' },
  AVERAGE: { label: '보통', color: 'bg-yellow-100 text-yellow-800', emoji: '😐' },
  BAD: { label: '별로', color: 'bg-red-100 text-red-800', emoji: '👎' },
};

const TYPE_LABELS = {
  RESTAURANT: '맛집',
  ATTRACTION: '명소',
};

export default function PlaceDetail({ place, isLoading, onClose }: PlaceDetailProps) {
  if (!place && !isLoading) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 md:absolute md:left-4 md:bottom-4 md:w-96 md:inset-x-auto">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[70vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
            ) : (
              <>
                <span className="text-lg font-bold">{place?.name}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                  {place && TYPE_LABELS[place.type]}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 flex-1">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
              <div className="h-20 w-full bg-gray-200 animate-pulse rounded" />
            </div>
          ) : place ? (
            <div className="space-y-4">
              {/* Address */}
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{place.address}</span>
              </div>

              {/* Description */}
              {place.description && (
                <p className="text-sm text-gray-700">{place.description}</p>
              )}

              {/* Memos */}
              {place.memos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-900">
                    {place.type === 'RESTAURANT' ? '메뉴 평가' : '평가'}
                  </h3>
                  <div className="space-y-2">
                    {place.memos.map((memo) => {
                      const ratingConfig = RATING_CONFIG[memo.rating];
                      return (
                        <div
                          key={memo.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{memo.itemName}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ratingConfig.color}`}>
                              {ratingConfig.emoji} {ratingConfig.label}
                            </span>
                          </div>
                          {memo.comment && (
                            <p className="text-sm text-gray-600">{memo.comment}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {place.memos.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
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
