import { useState, useMemo, useCallback, useEffect } from 'react';
import { Marker, PlaceType } from '@/types';
import { PUBLIC_TYPES, PERSONAL_TYPES } from '@/constants/placeConfig';

interface UseMarkerFilterOptions {
  markers: Marker[];
  isAuthenticated: boolean;
}

interface UseMarkerFilterReturn {
  filteredMarkers: Marker[];
  selectedTypes: Set<PlaceType>;
  selectedGrades: Set<number>;
  handleTypeToggle: (type: PlaceType | null) => void;
  setSelectedGrades: (grades: Set<number>) => void;
  enableMyFootprint: () => void;
  disablePersonalTypes: () => void;
}

const DEFAULT_GRADES = new Set([1, 2]); // 기본: 최애, 추천

/**
 * 마커 필터링 로직을 캡슐화한 훅
 * - 타입 필터 (공개/개인 카테고리)
 * - 등급 필터 (1=최애, 2=추천, 3=무난)
 * - 인증 상태에 따른 필터링
 */
export function useMarkerFilter({
  markers,
  isAuthenticated,
}: UseMarkerFilterOptions): UseMarkerFilterReturn {
  const [selectedTypes, setSelectedTypes] = useState<Set<PlaceType>>(new Set(PUBLIC_TYPES));
  const [selectedGrades, setSelectedGrades] = useState<Set<number>>(DEFAULT_GRADES);

  // 타입 + 등급 필터링된 마커 (비로그인 시 개인 카테고리 숨김)
  const filteredMarkers = useMemo(() => {
    let result = markers;

    // 비로그인 시 개인 카테고리 숨김
    if (!isAuthenticated) {
      result = result.filter(m => !PERSONAL_TYPES.includes(m.type));
    }

    // 선택된 타입 필터
    result = result.filter(m => selectedTypes.has(m.type));

    // 등급 필터 (공개 카테고리만 적용, 개인 카테고리는 항상 표시)
    if (selectedGrades.size === 0) return result.filter(m => PERSONAL_TYPES.includes(m.type));
    if (selectedGrades.size === 3) return result;
    return result.filter(m => PERSONAL_TYPES.includes(m.type) || (m.grade && selectedGrades.has(m.grade)));
  }, [markers, selectedTypes, selectedGrades, isAuthenticated]);

  // 타입 토글 핸들러
  const handleTypeToggle = useCallback((type: PlaceType | null) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);

      if (type === null) {
        // "전체" 클릭: 토글 동작
        const allPublicSelected = PUBLIC_TYPES.every(t => prev.has(t));
        if (allPublicSelected) {
          // 이미 전체 선택 상태 → 공개 3타입 모두 해제
          PUBLIC_TYPES.forEach(t => next.delete(t));
        } else {
          // 전체가 아님 → 공개 3타입 전체 선택
          PUBLIC_TYPES.forEach(t => next.add(t));
        }
        return next;
      }

      if (PERSONAL_TYPES.includes(type)) {
        // 개인 타입: 독립 토글
        if (next.has(type)) {
          next.delete(type);
        } else {
          next.add(type);
        }
        return next;
      }

      // 공개 타입 클릭
      const allPublicSelected = PUBLIC_TYPES.every(t => prev.has(t));
      if (allPublicSelected) {
        // 전체 상태에서 클릭 → 나머지 공개 타입 해제, 클릭한 것만
        PUBLIC_TYPES.forEach(t => next.delete(t));
        next.add(type);
      } else {
        // 개별 선택 상태 → 토글
        if (next.has(type)) {
          next.delete(type);
        } else {
          next.add(type);
        }
      }
      return next;
    });
  }, []);

  // 로그인 시 "나의 발자취" 활성화
  const enableMyFootprint = useCallback(() => {
    setSelectedTypes(prev => new Set([...prev, 'MY_FOOTPRINT']));
  }, []);

  // 로그아웃 시 개인 카테고리 해제
  const disablePersonalTypes = useCallback(() => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      PERSONAL_TYPES.forEach(t => next.delete(t));
      return next;
    });
  }, []);

  return {
    filteredMarkers,
    selectedTypes,
    selectedGrades,
    handleTypeToggle,
    setSelectedGrades,
    enableMyFootprint,
    disablePersonalTypes,
  };
}
