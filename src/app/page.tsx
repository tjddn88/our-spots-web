'use client';

import { useState, useEffect, useCallback } from 'react';
import KakaoMap from '@/components/KakaoMap';
import PlaceDetail from '@/components/PlaceDetail';
import PlaceForm, { PlaceFormData } from '@/components/PlaceForm';
import FilterButtons from '@/components/FilterButtons';
import AddressSearch from '@/components/AddressSearch';
import { mapApi, placeApi } from '@/services/api';
import { Marker, PlaceDetail as PlaceDetailType, PlaceType } from '@/types';

export default function Home() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailType | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(false);
  const [filterType, setFilterType] = useState<PlaceType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [newPlaceCoords, setNewPlaceCoords] = useState<{ lat: number; lng: number; address?: string; name?: string } | null>(null);
  const [moveTo, setMoveTo] = useState<{ lat: number; lng: number } | null>(null);

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

  const handleMapClick = useCallback((latlng: { lat: number; lng: number; address?: string }) => {
    setSelectedPlace(null);
    setPanelPosition(null);
    setNewPlaceCoords(latlng);
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

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Map */}
      <KakaoMap
        markers={markers}
        onMarkerClick={handleMarkerClick}
        onMapClick={handleMapClick}
        center={{ lat: 37.5665, lng: 126.978 }}
        zoom={3}
        moveTo={moveTo}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-gray-900 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg">
              Mr. Seong&apos;s Picks
            </h1>
            <FilterButtons selected={filterType} onChange={setFilterType} />
          </div>
          <AddressSearch onSelect={handleSearchSelect} />
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow-lg text-sm">
          {error}
        </div>
      )}

      {/* Place Detail Panel */}
      <PlaceDetail
        place={selectedPlace}
        isLoading={isLoadingPlace}
        onClose={handleCloseDetail}
        position={panelPosition}
      />

      {/* Place Form Modal */}
      {newPlaceCoords && (
        <PlaceForm
          latitude={newPlaceCoords.lat}
          longitude={newPlaceCoords.lng}
          initialAddress={newPlaceCoords.address}
          initialName={newPlaceCoords.name}
          onSubmit={handleCreatePlace}
          onClose={handleCloseForm}
        />
      )}

      {/* Marker count */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-sm text-gray-600">
        {markers.length}개 장소
      </div>
    </main>
  );
}
