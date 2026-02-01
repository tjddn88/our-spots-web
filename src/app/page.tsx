'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import KakaoMap from '@/components/KakaoMap';
import PlaceDetail from '@/components/PlaceDetail';
import PlaceForm, { PlaceFormData } from '@/components/PlaceForm';
import FilterButtons from '@/components/FilterButtons';
import AddressSearch from '@/components/AddressSearch';
import ShareLinkButton from '@/components/ShareLinkButton';
import LoginModal from '@/components/LoginModal';
import { mapApi, placeApi, authApi, isLoggedIn, clearToken } from '@/services/api';
import { Marker, PlaceDetail as PlaceDetailType, PlaceType } from '@/types';

export default function Home() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailType | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const [filterType, setFilterType] = useState<PlaceType | null>(null);
  const [selectedGrades, setSelectedGrades] = useState<Set<number>>(new Set([1, 2])); // 기본: 최애, 추천
  const [error, setError] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [newPlaceCoords, setNewPlaceCoords] = useState<{ lat: number; lng: number; address?: string; name?: string } | null>(null);
  const [moveTo, setMoveTo] = useState<{ lat: number; lng: number } | null>(null);
  const [editingPlace, setEditingPlace] = useState<PlaceDetailType | null>(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState<string | undefined>();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setIsAuthenticated(isLoggedIn());

    const handleAuthExpired = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const data = await mapApi.getMarkers(filterType ? { type: filterType } : undefined);
        setMarkers(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch markers:', err);
        setError('마커를 불러오는데 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      }
    };

    fetchMarkers();
  }, [filterType]);

  // 등급 필터링된 마커
  const filteredMarkers = useMemo(() => {
    if (selectedGrades.size === 0) return [];
    if (selectedGrades.size === 3) return markers;
    return markers.filter(m => m.grade && selectedGrades.has(m.grade));
  }, [markers, selectedGrades]);

  const handleMarkerClick = useCallback(async (marker: Marker, position: { x: number; y: number }) => {
    setPanelPosition(position);
    setIsLoadingPlace(true);
    try {
      const place = await placeApi.getById(marker.id);
      setSelectedPlace(place);
    } catch (err) {
      console.error('Failed to fetch place detail:', err);
    } finally {
      setIsLoadingPlace(false);
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPlace(null);
    setPanelPosition(null);
  }, []);

  const handleMapClick = useCallback(() => {
    // 맵 클릭 시 상세 패널만 닫기
    setSelectedPlace(null);
    setPanelPosition(null);
  }, []);

  const handleCreatePlace = useCallback(async (data: PlaceFormData) => {
    await placeApi.create(data);
    setNewPlaceCoords(null);
    // 마커 새로고침
    const newMarkers = await mapApi.getMarkers(filterType ? { type: filterType } : undefined);
    setMarkers(newMarkers);
  }, [filterType]);

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
    // 마커 새로고침
    const newMarkers = await mapApi.getMarkers(filterType ? { type: filterType } : undefined);
    setMarkers(newMarkers);
  }, [editingPlace, filterType]);

  const handleDeletePlace = useCallback(async (placeId: number) => {
    await placeApi.delete(placeId);
    setSelectedPlace(null);
    setPanelPosition(null);
    // 로컬 state에서 마커 제거 (백엔드 캐시 유지)
    setMarkers(prev => prev.filter(m => m.id !== placeId));
  }, []);

  const handleSearchSelect = useCallback((result: { lat: number; lng: number; address: string; name?: string }) => {
    // 맵 이동
    setMoveTo({ lat: result.lat, lng: result.lng });
    // 장소 추가 폼 열기
    setNewPlaceCoords({
      lat: result.lat,
      lng: result.lng,
      address: result.address,
      name: result.name,
    });
    setSelectedPlace(null);
    setPanelPosition(null);
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
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    authApi.logout();
    setIsAuthenticated(false);
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      {/* Map */}
      <KakaoMap
        markers={filteredMarkers}
        onMarkerClick={handleMarkerClick}
        onMapClick={handleMapClick}
        center={{ lat: 37.5665, lng: 126.978 }}
        zoom={3}
        moveTo={moveTo}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
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
            selected={filterType}
            onChange={setFilterType}
            selectedGrades={selectedGrades}
            onGradeChange={setSelectedGrades}
          />
          <AddressSearch onSelect={handleSearchSelect} />
        </div>
      </header>

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
        {/* Login/Logout Button */}
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onConfirm={handleLogin}
        isLoading={isLoggingIn}
        error={loginError}
      />
    </main>
  );
}
