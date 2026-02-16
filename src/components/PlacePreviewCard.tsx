'use client';

const CARD_WIDTH = 220;
const PIN_HEIGHT = 36;
const MARGIN = 8;

interface PlacePreviewCardProps {
  name: string;
  address: string;
  screenPosition: { x: number; y: number } | null;
  onRegister: () => void;
  onClose: () => void;
}

export default function PlacePreviewCard({ name, address, screenPosition, onRegister, onClose }: PlacePreviewCardProps) {
  // screenPosition이 있으면 핀 아래에 배치, 없으면 화면 중앙 fallback
  const style = screenPosition
    ? {
        left: Math.max(MARGIN, Math.min(screenPosition.x - CARD_WIDTH / 2, window.innerWidth - CARD_WIDTH - MARGIN)),
        top: Math.min(screenPosition.y + PIN_HEIGHT, window.innerHeight - 80),
      }
    : undefined;

  return (
    <div
      className={screenPosition ? 'absolute z-10' : 'absolute top-[55%] left-1/2 -translate-x-1/2 z-10'}
      style={style}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 pl-3 pr-2 py-2 flex items-center gap-2">
        <div className="min-w-0 max-w-40">
          <p className="font-medium text-xs text-gray-900 truncate">{name || '새 장소'}</p>
          <p className="text-[10px] text-gray-400 truncate">{address}</p>
        </div>
        <button
          onClick={onRegister}
          className="shrink-0 px-2.5 py-1 bg-blue-500 text-white text-[11px] font-medium rounded-full hover:bg-blue-600 transition-colors"
        >
          등록
        </button>
        <button
          onClick={onClose}
          className="shrink-0 p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="닫기"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
