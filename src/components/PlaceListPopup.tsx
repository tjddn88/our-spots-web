'use client';

import { Marker, PlaceType } from '@/types';

interface PlaceListPopupProps {
  markers: Marker[];
  position: { x: number; y: number };
  onSelect: (marker: Marker) => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<PlaceType, string> = {
  RESTAURANT: '맛집',
  KIDS_PLAYGROUND: '아이 놀이터',
  RELAXATION: '아빠의 시간',
  MY_FOOTPRINT: '나의 발자취',
  RECOMMENDED_RESTAURANT: '추천 맛집',
  RECOMMENDED_SPOT: '추천 명소',
};

const TYPE_COLORS: Record<PlaceType, string> = {
  RESTAURANT: 'bg-red-100 text-red-700',
  KIDS_PLAYGROUND: 'bg-green-100 text-green-700',
  RELAXATION: 'bg-blue-100 text-blue-700',
  MY_FOOTPRINT: 'bg-purple-100 text-purple-700',
  RECOMMENDED_RESTAURANT: 'bg-orange-100 text-orange-700',
  RECOMMENDED_SPOT: 'bg-teal-100 text-teal-700',
};

export default function PlaceListPopup({ markers, position, onSelect, onClose }: PlaceListPopupProps) {
  // 화면 경계 체크하여 위치 조정
  const adjustedPosition = { ...position };
  const popupWidth = 240;
  const popupMaxHeight = 300;

  if (typeof window !== 'undefined') {
    if (position.x + popupWidth > window.innerWidth - 16) {
      adjustedPosition.x = position.x - popupWidth - 60;
    }
    if (position.y + popupMaxHeight > window.innerHeight - 16) {
      adjustedPosition.y = Math.max(16, window.innerHeight - popupMaxHeight - 16);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-20"
        onClick={onClose}
      />

      {/* Popup */}
      <div
        className="fixed z-30 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          width: popupWidth,
          maxHeight: popupMaxHeight,
        }}
      >
        <div className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <p className="text-sm font-medium">이 위치의 장소 ({markers.length})</p>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: popupMaxHeight - 40 }}>
          {markers.map((marker) => (
            <button
              key={marker.id}
              onClick={() => onSelect(marker)}
              className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 truncate">{marker.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[marker.type]}`}>
                  {TYPE_LABELS[marker.type]}
                </span>
                {marker.grade && (
                  <span className="text-xs text-gray-500">
                    {marker.grade === 1 ? '최애' : marker.grade === 2 ? '추천' : '무난'}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
