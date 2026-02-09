'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import KakaoMap from '@/components/KakaoMap';
import type { KakaoMapHandle } from '@/components/KakaoMap';
import PlaceDetail from '@/components/PlaceDetail';
import PlaceForm, { PlaceFormData } from '@/components/PlaceForm';
import FilterButtons from '@/components/FilterButtons';
import AddressSearch from '@/components/AddressSearch';
import ShareLinkButton from '@/components/ShareLinkButton';
import LoginModal from '@/components/LoginModal';
import PlaceListPopup from '@/components/PlaceListPopup';
import PlacePreviewCard from '@/components/PlacePreviewCard';
import AboutModal from '@/components/AboutModal';
import SearchResultsPanel from '@/components/SearchResultsPanel';
import { mapApi, placeApi, authApi, isLoggedIn } from '@/services/api';
import { Marker, PlaceDetail as PlaceDetailType, SearchResultPlace } from '@/types';
import { useMarkerFilter } from '@/hooks/useMarkerFilter';

export default function Home() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailType | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [groupMarkers, setGroupMarkers] = useState<Marker[] | null>(null);
  const [groupPosition, setGroupPosition] = useState<{ x: number; y: number } | null>(null);
  const [newPlaceCoords, setNewPlaceCoords] = useState<{ lat: number; lng: number; address?: string; name?: string } | null>(null);
  const [moveTo, setMoveTo] = useState<{ lat: number; lng: number } | null>(null);
  const [editingPlace, setEditingPlace] = useState<PlaceDetailType | null>(null);
  const [previewPlace, setPreviewPlace] = useState<{ lat: number; lng: number; address: string; name: string } | null>(null);

  // Map search state
  const [searchResults, setSearchResults] = useState<SearchResultPlace[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResearchButton, setShowResearchButton] = useState(false);
  const [searchToast, setSearchToast] = useState<string | null>(null);
  const mapRef = useRef<KakaoMapHandle>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const searchKeywordRef = useRef('');
  const lastSearchCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  searchKeywordRef.current = searchKeyword;

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState<string | undefined>();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Marker filter hook
  const {
    filteredMarkers,
    selectedTypes,
    selectedGrades,
    handleTypeToggle,
    setSelectedGrades,
    enableMyFootprint,
    disablePersonalTypes,
  } = useMarkerFilter({ markers, isAuthenticated });

  useEffect(() => {
    const loggedIn = isLoggedIn();
    setIsAuthenticated(loggedIn);
    // 로그인 상태면 "나의 발자취" 기본 활성화
    if (loggedIn) {
      enableMyFootprint();
    }

    const handleAuthExpired = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [enableMyFootprint]);

  // 헤더 높이 측정 (SearchResultsPanel 위치용)
  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    });
    observer.observe(headerRef.current);
    setHeaderHeight(headerRef.current.offsetHeight);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const data = await mapApi.getMarkers();
        setMarkers(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch markers:', err);
        setError('마커를 불러오는데 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      }
    };

    fetchMarkers();
  }, []);

  const handleMarkerClick = useCallback(async (markers: Marker[], position: { x: number; y: number }) => {
    if (markers.length > 1) {
      // 그룹 마커: 장소 목록 팝업 표시
      setGroupMarkers(markers);
      setGroupPosition(position);
      setSelectedPlace(null);
      setPanelPosition(null);
    } else {
      // 단일 마커: 상세 정보 표시
      setGroupMarkers(null);
      setGroupPosition(null);
      setPanelPosition(position);
      setIsLoadingPlace(true);
      try {
        const place = await placeApi.getById(markers[0].id);
        setSelectedPlace(place);
      } catch (err) {
        console.error('Failed to fetch place detail:', err);
      } finally {
        setIsLoadingPlace(false);
      }
    }
  }, []);

  const handleGroupMarkerSelect = useCallback(async (marker: Marker) => {
    setGroupMarkers(null);
    setGroupPosition(null);
    setPanelPosition(groupPosition);
    setIsLoadingPlace(true);
    try {
      const place = await placeApi.getById(marker.id);
      setSelectedPlace(place);
    } catch (err) {
      console.error('Failed to fetch place detail:', err);
    } finally {
      setIsLoadingPlace(false);
    }
  }, [groupPosition]);

  const handleCloseGroupPopup = useCallback(() => {
    setGroupMarkers(null);
    setGroupPosition(null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPlace(null);
    setPanelPosition(null);
  }, []);

  const handleMapClick = useCallback(() => {
    // 맵 클릭 시 모든 팝업 닫기
    setSelectedPlace(null);
    setPanelPosition(null);
    setGroupMarkers(null);
    setGroupPosition(null);
    setPreviewPlace(null);
  }, []);

  const handleCreatePlace = useCallback(async (data: PlaceFormData) => {
    await placeApi.create(data);
    setNewPlaceCoords(null);
    // 마커 새로고침 (캐시된 데이터)
    const newMarkers = await mapApi.getMarkers();
    setMarkers(newMarkers);
  }, []);

  const handleCloseForm = useCallback(() => {
    setNewPlaceCoords(null);
    setEditingPlace(null);
  }, []);

  const handleEditPlace = useCallback((place: PlaceDetailType) => {
    setEditingPlace(place);
    setSelectedPlace(null);
    setPanelPosition(null);
  }, []);

  const handleUpdatePlace = useCallback(async (data: PlaceFormData) => {
    if (!editingPlace) return;
    await placeApi.update(editingPlace.id, data);
    setEditingPlace(null);
    // 마커 새로고침 (캐시된 데이터)
    const newMarkers = await mapApi.getMarkers();
    setMarkers(newMarkers);
  }, [editingPlace]);

  const handleDeletePlace = useCallback(async (placeId: number) => {
    await placeApi.delete(placeId);
    setSelectedPlace(null);
    setPanelPosition(null);
    // 로컬 state에서 마커 제거 (백엔드 캐시 유지)
    setMarkers(prev => prev.filter(m => m.id !== placeId));
  }, []);

  // 지도 내 장소 검색 (카카오 keywordSearch + rect + center)
  const performMapSearch = useCallback((keyword: string) => {
    if (!keyword.trim() || !window.kakao?.maps?.services) return;

    const bounds = mapRef.current?.getBounds();
    const center = mapRef.current?.getCenter();
    if (!bounds) return;

    setIsSearching(true);
    setShowResearchButton(false);

    const ps = new window.kakao.maps.services.Places();

    // rect: 사각형 범위 제한 (sw_lng, sw_lat, ne_lng, ne_lat)
    const rect = `${bounds.sw.lng},${bounds.sw.lat},${bounds.ne.lng},${bounds.ne.lat}`;

    const baseOptions: any = {
      rect,
      size: 15,
    };

    // 중심 좌표 전달 → 거리순 정렬로 근처 장소 우선
    if (center) {
      baseOptions.x = String(center.lng);
      baseOptions.y = String(center.lat);
      baseOptions.sort = window.kakao.maps.services.SortBy.DISTANCE;
    }

    const processResults = (allData: any[]) => {
      setIsSearching(false);

      if (center) {
        lastSearchCenterRef.current = center;
      }

      if (allData.length > 0) {
        // 중복 제거 (place_name + x + y 기준)
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
        setSelectedPlace(null);
        setPanelPosition(null);
        setGroupMarkers(null);
        setGroupPosition(null);
        setPreviewPlace(null);
      } else {
        setSearchResults([]);
        setSearchKeyword(keyword);
        setSearchToast('검색 결과가 없습니다');
        setTimeout(() => setSearchToast(null), 2000);
      }
    };

    // 1페이지 검색 후, 결과가 15개 이상이면 2페이지도 조회
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
  }, []);

  const handlePreviewRegister = useCallback(() => {
    if (!previewPlace) return;
    setNewPlaceCoords({
      lat: previewPlace.lat,
      lng: previewPlace.lng,
      address: previewPlace.address,
      name: previewPlace.name,
    });
    setPreviewPlace(null);
  }, [previewPlace]);

  const handlePreviewClose = useCallback(() => {
    setPreviewPlace(null);
  }, []);

  const handleMoveToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMoveTo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          alert('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
        } else {
          alert('현재 위치를 가져올 수 없습니다.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleLogin = useCallback(async (password: string) => {
    setIsLoggingIn(true);
    setLoginError(undefined);
    try {
      await authApi.login(password);
      setIsAuthenticated(true);
      setShowLoginModal(false);
      // 로그인 시 "나의 발자취" 기본 활성화
      enableMyFootprint();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setIsLoggingIn(false);
    }
  }, [enableMyFootprint]);

  const handleLogout = useCallback(() => {
    authApi.logout();
    setIsAuthenticated(false);
    // 로그아웃 시 개인 카테고리 선택 해제
    disablePersonalTypes();
  }, [disablePersonalTypes]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleRefreshMarkers = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await mapApi.refreshMarkers();
      setMarkers(data);
    } catch (err) {
      console.error('Failed to refresh markers:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 검색 실행 (AddressSearch에서 호출)
  const handleSearch = useCallback((keyword: string) => {
    performMapSearch(keyword);
  }, [performMapSearch]);

  // 지도 이동 시 재검색 버튼 표시
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
  }, []);

  // 플로팅 버튼 클릭 (현 지도에서 재검색)
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
    // 패널 닫되 키워드는 유지 (지도 이동 시 재검색 버튼용)
    setSearchResults([]);
    setSelectedPlace(null);
    setPanelPosition(null);
    setGroupMarkers(null);
    setGroupPosition(null);
  }, []);

  const handleCloseSearchResults = useCallback(() => {
    setSearchResults([]);
    setSearchKeyword('');
    setShowResearchButton(false);
    lastSearchCenterRef.current = null;
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      {/* Map */}
      <KakaoMap
        ref={mapRef}
        markers={filteredMarkers}
        onMarkerClick={handleMarkerClick}
        onMapClick={handleMapClick}
        center={{ lat: 37.5716, lng: 126.9768 }}
        zoom={3}
        moveTo={moveTo}
        previewPosition={previewPlace ? { lat: previewPlace.lat, lng: previewPlace.lng } : null}
        searchResults={searchResults}
        onSearchMarkerClick={handleSearchResultSelect}
        onMapMoved={handleMapMoved}
      />

      {/* Header */}
      <header ref={headerRef} className="absolute top-0 left-0 right-0 z-10">
        {/* Title Bar */}
        <div className="bg-[#FDFBF7] border-b border-stone-200/60 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1
              className="text-lg sm:text-xl font-semibold tracking-tight"
              style={{
                fontFamily: 'var(--font-noto-serif-kr), serif',
                color: '#3D3229'
              }}
            >
              하민이네 대동여지도
            </h1>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm px-4 pt-2 pb-2.5 flex flex-col gap-3">
          <FilterButtons
            selectedTypes={selectedTypes}
            onTypeToggle={handleTypeToggle}
            selectedGrades={selectedGrades}
            onGradeChange={setSelectedGrades}
            isAuthenticated={isAuthenticated}
          />
          <AddressSearch
            onSearch={handleSearch}
            isSearching={isSearching}
          />
        </div>
      </header>

      {/* 플로팅 "현 지도에서 검색" 버튼 */}
      <button
        onClick={handleResearch}
        style={{ top: `${headerHeight + 12}px` }}
        className={`absolute -translate-x-1/2 z-20 bg-white border border-blue-400 text-blue-600 px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-300 ${
          showResearchButton && searchKeyword
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        } ${
          searchResults.length > 0
            ? 'left-1/2 sm:left-[calc(50%+10rem)]'
            : 'left-1/2'
        }`}
      >
        ↻ 현 지도에서 검색
      </button>

      {/* 검색 결과 없음 토스트 */}
      {searchToast && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 bg-gray-800/90 text-white px-4 py-2 rounded-full text-sm shadow-lg"
          style={{ top: `${headerHeight + 12}px` }}
        >
          {searchToast}
        </div>
      )}

      {/* Search Results Panel (현 지도 내 검색 결과) */}
      {searchResults.length > 0 && (
        <SearchResultsPanel
          results={searchResults}
          keyword={searchKeyword}
          onSelect={handleSearchResultSelect}
          onClose={handleCloseSearchResults}
          headerHeight={headerHeight}
        />
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-10 bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow-lg text-sm">
          {error}
        </div>
      )}

      {/* Place Detail Panel */}
      <PlaceDetail
        place={selectedPlace}
        isLoading={isLoadingPlace}
        onClose={handleCloseDetail}
        onEdit={handleEditPlace}
        onDelete={handleDeletePlace}
        position={panelPosition}
        isAuthenticated={isAuthenticated}
      />

      {/* Place List Popup (같은 위치에 여러 장소) */}
      {groupMarkers && groupPosition && (
        <PlaceListPopup
          markers={groupMarkers}
          position={groupPosition}
          onSelect={handleGroupMarkerSelect}
          onClose={handleCloseGroupPopup}
        />
      )}

      {/* Place Preview Card (검색 결과 클릭 시 미리보기) */}
      {previewPlace && (
        <PlacePreviewCard
          name={previewPlace.name}
          address={previewPlace.address}
          onRegister={handlePreviewRegister}
          onClose={handlePreviewClose}
        />
      )}

      {/* Place Form Modal - Create (검색 결과 클릭으로만 열림) */}
      {newPlaceCoords && (
        <PlaceForm
          latitude={newPlaceCoords.lat}
          longitude={newPlaceCoords.lng}
          initialAddress={newPlaceCoords.address}
          initialName={newPlaceCoords.name}
          isAuthenticated={isAuthenticated}
          onSubmit={handleCreatePlace}
          onClose={handleCloseForm}
        />
      )}

      {/* Place Form Modal - Edit */}
      {editingPlace && (
        <PlaceForm
          latitude={editingPlace.latitude}
          longitude={editingPlace.longitude}
          initialAddress={editingPlace.address}
          initialName={editingPlace.name}
          initialType={editingPlace.type}
          initialDescription={editingPlace.description}
          initialGrade={editingPlace.grade}
          isEditMode
          isAuthenticated={isAuthenticated}
          onSubmit={handleUpdatePlace}
          onClose={handleCloseForm}
        />
      )}

      {/* Floating action buttons - bottom left */}
      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 z-10 flex flex-col gap-2">
        {isAuthenticated && (
          <button
            onClick={handleRefreshMarkers}
            disabled={isRefreshing}
            className="bg-white/90 backdrop-blur p-2.5 rounded-full shadow-lg hover:bg-white transition-colors disabled:opacity-50"
            title="DB에서 마커 새로고침"
          >
            <svg
              className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
        <button
          onClick={isAuthenticated ? handleLogout : () => { setLoginError(undefined); setShowLoginModal(true); }}
          className={`backdrop-blur p-2.5 rounded-full shadow-lg transition-colors ${
            isAuthenticated
              ? 'bg-green-100/90 hover:bg-green-200'
              : 'bg-white/90 hover:bg-white'
          }`}
          title={isAuthenticated ? '로그아웃' : '관리자 로그인'}
        >
          {isAuthenticated ? (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </button>
      </div>

      {/* Floating action buttons - bottom right */}
      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleMoveToCurrentLocation}
          className="bg-white/90 backdrop-blur p-2.5 rounded-full shadow-lg hover:bg-white transition-colors"
          title="현재 위치로 이동"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <ShareLinkButton />
        <button
          onClick={() => setShowAbout(true)}
          className="bg-white/90 backdrop-blur p-2.5 rounded-full shadow-lg hover:bg-white transition-colors"
          title="프로젝트 소개"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onConfirm={handleLogin}
        isLoading={isLoggingIn}
        error={loginError}
      />

      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </main>
  );
}
