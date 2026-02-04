'use client';

import { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface SearchResult {
  place_name: string;
  address_name: string;
  road_address_name?: string;
  x: string; // longitude
  y: string; // latitude
}

interface AddressSearchProps {
  onSelect: (result: { lat: number; lng: number; address: string; name?: string }) => void;
}

export default function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 결과 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (!query.trim() || !window.kakao?.maps?.services) return;

    setIsSearching(true);
    const geocoder = new window.kakao.maps.services.Geocoder();
    const ps = new window.kakao.maps.services.Places();

    // 1. 키워드 검색 먼저 시도
    ps.keywordSearch(query, (keywordData: SearchResult[], keywordStatus: any) => {
      const keywordResults: SearchResult[] = [];
      if (keywordStatus === window.kakao.maps.services.Status.OK) {
        keywordResults.push(...keywordData.slice(0, 5));
      }

      // 2. 주소 검색도 시도
      geocoder.addressSearch(query, (addressData: any[], addressStatus: any) => {
        setIsSearching(false);

        const addressResults: SearchResult[] = [];
        if (addressStatus === window.kakao.maps.services.Status.OK) {
          addressResults.push(...addressData.slice(0, 3).map((item: any) => ({
            place_name: item.road_address?.building_name || item.address_name,
            address_name: item.address_name,
            road_address_name: item.road_address?.address_name,
            x: item.x,
            y: item.y,
          })));
        }

        // 키워드 검색 결과 상단, 주소 검색 결과 하단 (중복 제거)
        const combined = [...keywordResults];
        const keywordKeys = new Set(keywordResults.map(r => `${r.x},${r.y}`));

        addressResults.forEach(r => {
          if (!keywordKeys.has(`${r.x},${r.y}`)) {
            combined.push(r);
          }
        });

        setResults(combined.slice(0, 7)); // 최대 7개
        setShowResults(true);
      });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelect = (result: SearchResult) => {
    onSelect({
      lat: parseFloat(result.y),
      lng: parseFloat(result.x),
      address: result.road_address_name || result.address_name,
      name: result.place_name,
    });
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="주소 또는 장소 검색"
          className="w-64 px-3 py-1.5 bg-white/90 backdrop-blur border rounded-full text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-medium shadow hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? '...' : '검색'}
        </button>
      </div>

      {/* 검색 결과 */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl border overflow-hidden z-50">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
            >
              <div className="font-medium text-sm">{result.place_name}</div>
              <div className="text-xs text-gray-500">
                {result.road_address_name || result.address_name}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl border p-3 text-sm text-gray-500 z-50">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}
