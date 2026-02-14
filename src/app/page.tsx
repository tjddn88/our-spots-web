'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import KakaoMap from '@/components/KakaoMap';
import type { KakaoMapHandle } from '@/components/KakaoMap';
import PlaceDetail from '@/components/PlaceDetail';
import PlaceForm from '@/components/PlaceForm';
import FilterButtons from '@/components/FilterButtons';
import AddressSearch from '@/components/AddressSearch';
import ShareLinkButton from '@/components/ShareLinkButton';
import LoginModal from '@/components/LoginModal';
import PlaceListPopup from '@/components/PlaceListPopup';
import PlacePreviewCard from '@/components/PlacePreviewCard';
import AboutModal from '@/components/AboutModal';
import SearchResultsPanel from '@/components/SearchResultsPanel';
import { LocationPinIcon, RefreshIcon, LockIcon, UnlockIcon, CurrentLocationIcon, ChatBubbleIcon } from '@/components/icons';
import { mapApi } from '@/services/api';
import { Marker } from '@/types';
import { useMarkerFilter } from '@/hooks/useMarkerFilter';
import { useAuth } from '@/hooks/useAuth';
import { usePlaceActions } from '@/hooks/usePlaceActions';
import { useMapSearch } from '@/hooks/useMapSearch';
import { DEFAULT_CENTER } from '@/constants/placeConfig';

export default function Home() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [moveTo, setMoveTo] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<KakaoMapHandle>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Auth hook (called before useMarkerFilter so we have isAuthenticated)
  // Uses onLogin/onLogout callbacks that will be wired to filter after
  const filterCallbacksRef = useRef<{ enableMyFootprint: () => void; disablePersonalTypes: () => void }>({
    enableMyFootprint: () => {},
    disablePersonalTypes: () => {},
  });

  const auth = useAuth({
    onLogin: useCallback(() => filterCallbacksRef.current.enableMyFootprint(), []),
    onLogout: useCallback(() => filterCallbacksRef.current.disablePersonalTypes(), []),
  });

  // Marker filter hook
  const {
    filteredMarkers,
    selectedTypes,
    selectedGrades,
    handleTypeToggle,
    setSelectedGrades,
    enableMyFootprint,
    disablePersonalTypes,
  } = useMarkerFilter({ markers, isAuthenticated: auth.isAuthenticated });

  // Wire filter callbacks to auth via ref
  filterCallbacksRef.current = { enableMyFootprint, disablePersonalTypes };

  // Place actions hook
  const place = usePlaceActions({ setMarkers, setMoveTo });

  // Map search hook
  const search = useMapSearch({
    mapRef,
    setMoveTo,
    setPreviewPlace: place.setPreviewPlace,
    clearPanels: place.clearPanels,
    clearDetailPanels: place.clearDetailPanels,
  });

  // About modal & refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showAboutBadge, setShowAboutBadge] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('about-seen')) {
      setShowAboutBadge(true);
    }
  }, []);

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

  // 마커 fetch
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

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      {/* Map */}
      <KakaoMap
        ref={mapRef}
        markers={filteredMarkers}
        onMarkerClick={place.handleMarkerClick}
        onMapClick={place.handleMapClick}
        center={DEFAULT_CENTER}
        zoom={3}
        moveTo={moveTo}
        previewPosition={place.previewPlace ? { lat: place.previewPlace.lat, lng: place.previewPlace.lng } : null}
        searchResults={search.searchResults}
        onSearchMarkerClick={search.handleSearchResultSelect}
        onMapMoved={search.handleMapMoved}
      />

      {/* Header */}
      <header ref={headerRef} className="absolute top-0 left-0 right-0 z-10">
        {/* Title Bar */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="px-4 py-2.5 flex items-center gap-2">
            <LocationPinIcon className="w-5 h-5 text-red-500 shrink-0" />
            <h1
              className="text-lg sm:text-xl font-bold tracking-tight text-[#1E293B]"
              style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
            >
              Our<span className="font-light">Spots</span>
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
            isAuthenticated={auth.isAuthenticated}
          />
          <AddressSearch
            onSelect={place.handleSearchSelect}
            onSearchKeyword={search.handleSearchKeyword}
          />
        </div>
      </header>

      {/* 플로팅 "현 지도에서 검색" 버튼 */}
      <button
        onClick={search.handleResearch}
        style={{ top: `${headerHeight + 12}px` }}
        className={`absolute -translate-x-1/2 z-20 bg-white border border-blue-400 text-blue-600 px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-300 ${
          search.showResearchButton && search.searchKeyword
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        } ${
          search.searchResults.length > 0
            ? 'left-1/2 sm:left-[calc(50%+10rem)]'
            : 'left-1/2'
        }`}
      >
        ↻ 현 지도에서 검색
      </button>

      {/* 검색 결과 없음 토스트 */}
      {search.searchToast && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 bg-gray-800/90 text-white px-4 py-2 rounded-full text-sm shadow-lg"
          style={{ top: `${headerHeight + 12}px` }}
        >
          {search.searchToast}
        </div>
      )}

      {/* Search Results Panel (현 지도 내 검색 결과) */}
      {search.searchResults.length > 0 && (
        <SearchResultsPanel
          results={search.searchResults}
          keyword={search.searchKeyword}
          onSelect={search.handleSearchResultSelect}
          onClose={search.handleCloseSearchResults}
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
        place={place.selectedPlace}
        isLoading={place.isLoadingPlace}
        onClose={place.handleCloseDetail}
        onEdit={place.handleEditPlace}
        onDelete={place.handleDeletePlace}
        position={place.panelPosition}
        isAuthenticated={auth.isAuthenticated}
      />

      {/* Place List Popup (같은 위치에 여러 장소) */}
      {place.groupMarkers && place.groupPosition && (
        <PlaceListPopup
          markers={place.groupMarkers}
          position={place.groupPosition}
          onSelect={place.handleGroupMarkerSelect}
          onClose={place.handleCloseGroupPopup}
        />
      )}

      {/* Place Preview Card (검색 결과 클릭 시 미리보기) */}
      {place.previewPlace && (
        <PlacePreviewCard
          name={place.previewPlace.name}
          address={place.previewPlace.address}
          onRegister={place.handlePreviewRegister}
          onClose={place.handlePreviewClose}
        />
      )}

      {/* Place Form Modal - Create (검색 결과 클릭으로만 열림) */}
      {place.newPlaceCoords && (
        <PlaceForm
          latitude={place.newPlaceCoords.lat}
          longitude={place.newPlaceCoords.lng}
          initialAddress={place.newPlaceCoords.address}
          initialName={place.newPlaceCoords.name}
          isAuthenticated={auth.isAuthenticated}
          onSubmit={place.handleCreatePlace}
          onClose={place.handleCloseForm}
        />
      )}

      {/* Place Form Modal - Edit */}
      {place.editingPlace && (
        <PlaceForm
          latitude={place.editingPlace.latitude}
          longitude={place.editingPlace.longitude}
          initialAddress={place.editingPlace.address}
          initialName={place.editingPlace.name}
          initialType={place.editingPlace.type}
          initialDescription={place.editingPlace.description}
          initialGrade={place.editingPlace.grade}
          isEditMode
          isAuthenticated={auth.isAuthenticated}
          onSubmit={place.handleUpdatePlace}
          onClose={place.handleCloseForm}
        />
      )}

      {/* Floating action buttons - bottom left */}
      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 z-10 flex flex-col gap-2">
        {auth.isAuthenticated && (
          <button
            onClick={handleRefreshMarkers}
            disabled={isRefreshing}
            className="bg-white/90 backdrop-blur p-2.5 rounded-full shadow-lg hover:bg-white transition-colors disabled:opacity-50"
            title="DB에서 마커 새로고침"
          >
            <RefreshIcon className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button
          onClick={auth.isAuthenticated ? auth.handleLogout : () => { auth.setLoginError(undefined); auth.setShowLoginModal(true); }}
          className={`backdrop-blur p-2.5 rounded-full shadow-lg transition-colors ${
            auth.isAuthenticated
              ? 'bg-green-100/90 hover:bg-green-200'
              : 'bg-white/90 hover:bg-white'
          }`}
          title={auth.isAuthenticated ? '로그아웃' : '관리자 로그인'}
        >
          {auth.isAuthenticated ? (
            <UnlockIcon className="w-5 h-5 text-green-600" />
          ) : (
            <LockIcon className="w-5 h-5 text-gray-600" />
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
          <CurrentLocationIcon className="w-5 h-5 text-gray-600" />
        </button>
        <ShareLinkButton />
        <button
          onClick={() => { setShowAbout(true); setShowAboutBadge(false); localStorage.setItem('about-seen', '1'); }}
          className="relative bg-white/90 backdrop-blur p-2.5 rounded-full shadow-lg hover:bg-white transition-colors"
          title="프로젝트 소개"
        >
          <ChatBubbleIcon className="w-5 h-5 text-gray-600" />
          {showAboutBadge && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={auth.showLoginModal}
        onClose={() => auth.setShowLoginModal(false)}
        onConfirm={auth.handleLogin}
        isLoading={auth.isLoggingIn}
        error={auth.loginError}
      />

      {/* About Modal */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </main>
  );
}
