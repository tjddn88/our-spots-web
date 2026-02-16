import { useState, useCallback, useRef } from 'react';
import type { KakaoMapHandle } from '@/components/KakaoMap';
import { SearchResultPlace } from '@/types';

interface UseMapSearchOptions {
  mapRef: React.RefObject<KakaoMapHandle | null>;
  setMoveTo: (moveTo: { lat: number; lng: number; zoom?: number } | null) => void;
  setPreviewPlace: (place: { lat: number; lng: number; address: string; name: string } | null) => void;
  clearPanels: () => void;
  clearDetailPanels: () => void;
}

interface UseMapSearchReturn {
  searchResults: SearchResultPlace[];
  searchKeyword: string;
  showResearchButton: boolean;
  searchToast: string | null;
  performMapSearch: (keyword: string) => void;
  handleSearchKeyword: (keyword: string) => void;
  handleMapMoved: () => void;
  handleResearch: () => void;
  handleSearchResultSelect: (result: SearchResultPlace) => void;
  handleCloseSearchResults: () => void;
}

export function useMapSearch({
  mapRef,
  setMoveTo,
  setPreviewPlace,
  clearPanels,
  clearDetailPanels,
}: UseMapSearchOptions): UseMapSearchReturn {
  const [searchResults, setSearchResults] = useState<SearchResultPlace[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showResearchButton, setShowResearchButton] = useState(false);
  const [searchToast, setSearchToast] = useState<string | null>(null);
  const searchKeywordRef = useRef('');
  const lastSearchCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  searchKeywordRef.current = searchKeyword;

  const performMapSearch = useCallback((keyword: string) => {
    if (!keyword.trim() || !window.kakao?.maps?.services) return;

    const bounds = mapRef.current?.getBounds();
    const center = mapRef.current?.getCenter();
    if (!bounds) return;

    setShowResearchButton(false);

    const ps = new window.kakao.maps.services.Places();

    const rect = `${bounds.sw.lng},${bounds.sw.lat},${bounds.ne.lng},${bounds.ne.lat}`;

    const baseOptions: any = {
      rect,
      size: 15,
    };

    if (center) {
      baseOptions.x = String(center.lng);
      baseOptions.y = String(center.lat);
      baseOptions.sort = window.kakao.maps.services.SortBy.DISTANCE;
    }

    const processResults = (allData: any[]) => {
      if (center) {
        lastSearchCenterRef.current = center;
      }

      if (allData.length > 0) {
        const seen = new Set<string>();
        const unique = allData.filter((item: any) => {
          const key = `${item.place_name}_${item.x}_${item.y}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const results: SearchResultPlace[] = unique.slice(0, 15).map((item: any, index: number) => ({
          label: String.fromCharCode(65 + index),
          name: item.place_name,
          category: item.category_group_name || '',
          address: item.road_address_name || item.address_name,
          phone: item.phone || '',
          lat: parseFloat(item.y),
          lng: parseFloat(item.x),
        }));
        setSearchResults(results);
        setSearchKeyword(keyword);
        clearPanels();
      } else {
        setSearchResults([]);
        setSearchKeyword(keyword);
        setSearchToast('검색 결과가 없습니다');
        setTimeout(() => setSearchToast(null), 2000);
      }
    };

    ps.keywordSearch(
      keyword,
      (data1: any[], status1: any) => {
        const page1 = status1 === window.kakao.maps.services.Status.OK ? data1 : [];

        if (page1.length >= 15) {
          ps.keywordSearch(
            keyword,
            (data2: any[], status2: any) => {
              const page2 = status2 === window.kakao.maps.services.Status.OK ? data2 : [];
              processResults([...page1, ...page2]);
            },
            { ...baseOptions, page: 2 }
          );
        } else {
          processResults(page1);
        }
      },
      { ...baseOptions, page: 1 }
    );
  }, [mapRef, clearPanels]);

  const handleSearchKeyword = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    searchKeywordRef.current = keyword;
  }, []);

  const handleMapMoved = useCallback(() => {
    if (!searchKeywordRef.current) return;

    const currentCenter = mapRef.current?.getCenter();
    const lastCenter = lastSearchCenterRef.current;

    if (!lastCenter) {
      setShowResearchButton(true);
      return;
    }

    if (currentCenter) {
      const dLat = currentCenter.lat - lastCenter.lat;
      const dLng = currentCenter.lng - lastCenter.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist > 0.002) {
        setShowResearchButton(true);
      }
    }
  }, [mapRef]);

  const handleResearch = useCallback(() => {
    performMapSearch(searchKeywordRef.current);
  }, [performMapSearch]);

  const handleSearchResultSelect = useCallback((result: SearchResultPlace) => {
    setMoveTo({ lat: result.lat, lng: result.lng });
    setPreviewPlace({
      lat: result.lat,
      lng: result.lng,
      address: result.address,
      name: result.name,
    });
    setSearchResults([]);
    clearDetailPanels();
  }, [setMoveTo, setPreviewPlace, clearDetailPanels]);

  const handleCloseSearchResults = useCallback(() => {
    setSearchResults([]);
    setSearchKeyword('');
    setShowResearchButton(false);
    lastSearchCenterRef.current = null;
  }, []);

  return {
    searchResults,
    searchKeyword,
    showResearchButton,
    searchToast,
    performMapSearch,
    handleSearchKeyword,
    handleMapMoved,
    handleResearch,
    handleSearchResultSelect,
    handleCloseSearchResults,
  };
}
