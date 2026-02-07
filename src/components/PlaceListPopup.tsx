'use client';

import { Marker } from '@/types';
import { TYPE_CONFIG, PANEL_DIMENSIONS, GRADE_LABELS } from '@/constants/placeConfig';

interface PlaceListPopupProps {
  markers: Marker[];
  position: { x: number; y: number };
  onSelect: (marker: Marker) => void;
  onClose: () => void;
}

export default function PlaceListPopup({ markers, position, onSelect, onClose }: PlaceListPopupProps) {
  // 화면 경계 체크하여 위치 조정
  const adjustedPosition = { ...position };
  const { LIST_WIDTH: popupWidth, LIST_MAX_HEIGHT: popupMaxHeight, MARGIN: margin } = PANEL_DIMENSIONS;

  if (typeof window !== 'undefined') {
    // 우측 경계 초과 시 마커 왼쪽으로 배치
    if (position.x + popupWidth > window.innerWidth - margin) {
      adjustedPosition.x = position.x - popupWidth - 60;
    }
    // 좌측 경계 클램핑
    if (adjustedPosition.x < margin) {
      adjustedPosition.x = margin;
    }
    // 하단 경계 초과 시 위로 조정
    if (position.y + popupMaxHeight > window.innerHeight - margin) {
      adjustedPosition.y = Math.max(margin, window.innerHeight - popupMaxHeight - margin);
    }
    // 상단 경계 클램핑
    if (adjustedPosition.y < margin) {
      adjustedPosition.y = margin;
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
                <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_CONFIG[marker.type].color}`}>
                  {TYPE_CONFIG[marker.type].label}
                </span>
                {marker.grade && (
                  <span className="text-xs text-gray-500">
                    {GRADE_LABELS.find(g => g.grade === marker.grade)?.label}
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
