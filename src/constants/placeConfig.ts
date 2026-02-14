import { PlaceType } from '@/types';

// ============================================================================
// Type Configuration
// ============================================================================

export const TYPE_CONFIG: Record<PlaceType, {
  label: string;
  emoji: string;
  color: string;
  activeColor: string;
}> = {
  RESTAURANT: {
    label: '맛집',
    emoji: '🍽️',
    color: 'bg-red-100 text-red-700',
    activeColor: 'bg-red-500 text-white',
  },
  KIDS_PLAYGROUND: {
    label: '아이 놀이터',
    emoji: '🎠',
    color: 'bg-green-100 text-green-700',
    activeColor: 'bg-emerald-500 text-white',
  },
  RELAXATION: {
    label: '아빠의 시간',
    emoji: '☕',
    color: 'bg-blue-100 text-blue-700',
    activeColor: 'bg-indigo-500 text-white',
  },
  MY_FOOTPRINT: {
    label: '나의 발자취',
    emoji: '👣',
    color: 'bg-purple-100 text-purple-700',
    activeColor: 'bg-amber-500 text-white',
  },
  RECOMMENDED_RESTAURANT: {
    label: '추천 맛집',
    emoji: '🍴',
    color: 'bg-orange-100 text-orange-700',
    activeColor: 'bg-pink-500 text-white',
  },
  RECOMMENDED_SPOT: {
    label: '추천 명소',
    emoji: '🏛️',
    color: 'bg-teal-100 text-teal-700',
    activeColor: 'bg-cyan-600 text-white',
  },
};

// ============================================================================
// Grade Configuration
// ============================================================================

export const GRADE_CONFIG: Record<PlaceType, Record<1 | 2 | 3, { label: string; color: string }>> = {
  RESTAURANT: {
    1: { label: '🔥 찐맛집', color: 'bg-red-600 text-white' },
    2: { label: '👌 괜찮은 곳', color: 'bg-red-400 text-white' },
    3: { label: '🙂 무난한', color: 'bg-red-200 text-red-800' },
  },
  KIDS_PLAYGROUND: {
    1: { label: '⭐ 하민 최애', color: 'bg-green-700 text-white' },
    2: { label: '👍 하민 추천', color: 'bg-green-500 text-white' },
    3: { label: '🙂 무난한', color: 'bg-lime-300 text-green-800' },
  },
  RELAXATION: {
    1: { label: '⭐ 소중한 시간', color: 'bg-blue-900 text-white' },
    2: { label: '👍 알찬 시간', color: 'bg-blue-500 text-white' },
    3: { label: '🙂 무난한', color: 'bg-sky-200 text-blue-800' },
  },
  MY_FOOTPRINT: {
    1: { label: '⭐ 특별한 곳', color: 'bg-purple-700 text-white' },
    2: { label: '👍 좋은 곳', color: 'bg-purple-500 text-white' },
    3: { label: '🙂 무난한', color: 'bg-purple-200 text-purple-800' },
  },
  RECOMMENDED_RESTAURANT: {
    1: { label: '🔥 강추', color: 'bg-orange-700 text-white' },
    2: { label: '👌 괜찮은 곳', color: 'bg-orange-500 text-white' },
    3: { label: '🙂 무난한', color: 'bg-orange-200 text-orange-800' },
  },
  RECOMMENDED_SPOT: {
    1: { label: '⭐ 꼭 가볼 곳', color: 'bg-teal-600 text-white' },
    2: { label: '👍 가볼만한 곳', color: 'bg-teal-400 text-white' },
    3: { label: '🙂 무난한', color: 'bg-teal-200 text-teal-800' },
  },
};

// ============================================================================
// Marker Colors (for KakaoMap)
// ============================================================================

export const MARKER_COLORS: Record<PlaceType, Record<1 | 2 | 3, string>> = {
  RESTAURANT: {
    1: '#DC2626', // 진빨강 (Dark Red)
    2: '#F87171', // 빨강 (Red)
    3: '#FCA5A5', // 연빨강 (Light Red)
  },
  KIDS_PLAYGROUND: {
    1: '#166534', // 진초록 (Forest)
    2: '#22C55E', // 초록 (Green)
    3: '#84CC16', // 연두 (Lime)
  },
  RELAXATION: {
    1: '#1E3A8A', // 네이비 (Navy)
    2: '#3B82F6', // 파랑 (Blue)
    3: '#7DD3FC', // 하늘 (Sky Blue)
  },
  MY_FOOTPRINT: {
    1: '#7E22CE', // 진보라 (Deep Purple)
    2: '#A855F7', // 보라 (Purple)
    3: '#D8B4FE', // 라벤더 (Lavender)
  },
  RECOMMENDED_RESTAURANT: {
    1: '#C2410C', // 진주황 (Burnt Orange)
    2: '#F97316', // 주황 (Orange)
    3: '#FDBA74', // 살구 (Apricot)
  },
  RECOMMENDED_SPOT: {
    1: '#0D9488', // 청록 (Teal)
    2: '#2DD4BF', // 터쿼이즈 (Turquoise)
    3: '#99F6E4', // 민트 (Mint)
  },
};

export const DEFAULT_MARKER_COLOR = '#9CA3AF';

// ============================================================================
// Filter Configuration
// ============================================================================

export const PUBLIC_TYPES: PlaceType[] = ['RESTAURANT', 'KIDS_PLAYGROUND', 'RELAXATION'];
export const PERSONAL_TYPES: PlaceType[] = ['MY_FOOTPRINT', 'RECOMMENDED_RESTAURANT', 'RECOMMENDED_SPOT'];

export const PUBLIC_FILTERS: { type: PlaceType | null; label: string; emoji: string }[] = [
  { type: null, label: '전체', emoji: '📍' },
  { type: 'RESTAURANT', label: '맛집', emoji: '🍽️' },
  { type: 'KIDS_PLAYGROUND', label: '아이 놀이터', emoji: '🎠' },
  { type: 'RELAXATION', label: '아빠의 시간', emoji: '☕' },
];

export const PERSONAL_FILTERS: { type: PlaceType; label: string; emoji: string }[] = [
  { type: 'MY_FOOTPRINT', label: '나의 발자취', emoji: '👣' },
  { type: 'RECOMMENDED_RESTAURANT', label: '추천 맛집', emoji: '🍴' },
  { type: 'RECOMMENDED_SPOT', label: '추천 명소', emoji: '🏛️' },
];

export const GRADE_LABELS = [
  { grade: 1, label: '최애' },
  { grade: 2, label: '추천' },
  { grade: 3, label: '무난' },
] as const;

// ============================================================================
// UI Dimensions
// ============================================================================

export const PANEL_DIMENSIONS = {
  // PlaceDetail
  DETAIL_WIDTH: 288,    // w-72
  DETAIL_HEIGHT: 320,   // max-h-80
  HEADER_HEIGHT: 140,

  // PlaceListPopup
  LIST_WIDTH: 240,
  LIST_MAX_HEIGHT: 300,

  // Common
  MARGIN: 16,
} as const;

export const MAP_ZOOM = {
  DEFAULT: 3,
  ON_MOVE: 6,
} as const;

export const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 } as const;

// ============================================================================
// Helper Functions
// ============================================================================

export const getGradeLabel = (type: PlaceType, grade?: number) => {
  const config = GRADE_CONFIG[type];
  if (config && grade && config[grade as 1 | 2 | 3]) {
    return config[grade as 1 | 2 | 3];
  }
  const typeConfig = TYPE_CONFIG[type];
  return { label: typeConfig?.label || '장소', color: 'bg-gray-100 text-gray-800' };
};

export const getMarkerColor = (type: PlaceType, grade?: number): string => {
  const colors = MARKER_COLORS[type];
  if (colors && grade && colors[grade as 1 | 2 | 3]) {
    return colors[grade as 1 | 2 | 3];
  }
  return DEFAULT_MARKER_COLOR;
};
