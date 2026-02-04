'use client';

interface PlacePreviewCardProps {
  name: string;
  address: string;
  onRegister: () => void;
  onClose: () => void;
}

export default function PlacePreviewCard({ name, address, onRegister, onClose }: PlacePreviewCardProps) {
  return (
    <div className="absolute top-[55%] left-1/2 -translate-x-1/2 z-10">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 pl-3 pr-2 py-2 flex items-center gap-2">
        <div className="min-w-0 max-w-40">
          <p className="font-medium text-xs text-gray-900 truncate">{name}</p>
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
