'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker, PlaceType } from '@/types';
import { MARKER_COLORS, DEFAULT_MARKER_COLOR, MAP_ZOOM, getMarkerColor } from '@/constants/placeConfig';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  markers: Marker[];
  onMarkerClick: (markers: Marker[], position: { x: number; y: number }) => void;
  onMapClick?: (latlng: { lat: number; lng: number; address?: string }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  moveTo?: { lat: number; lng: number } | null;
  previewPosition?: { lat: number; lng: number } | null;
}

// 좌표를 키로 변환 (소수점 5자리까지 반올림하여 같은 위치 판단)
const coordKey = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY || '';

export default function KakaoMap({
  markers,
  onMarkerClick,
  onMapClick,
  center = { lat: 37.5665, lng: 126.978 },
  zoom = MAP_ZOOM.DEFAULT,
  moveTo,
  previewPosition,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstancesRef = useRef<any[]>([]);
  const previewPinRef = useRef<any>(null);
  const markerClickedRef = useRef(false); // 마커 클릭 플래그
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Kakao Maps SDK
  useEffect(() => {
    // 이미 로드되어 있고 services도 있으면 바로 사용
    if (window.kakao?.maps?.Map && window.kakao?.maps?.services?.Geocoder) {
      setIsLoaded(true);
      return;
    }

    // 이미 스크립트가 있으면 제거 (services 없이 로드된 경우 대비)
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      existingScript.remove();
      delete (window as any).kakao;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services`;
    script.async = true;

    script.onload = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          setIsLoaded(true);
        });
      } else {
        setError('카카오맵 SDK 로드 실패');
      }
    };

    script.onerror = () => {
      setError('카카오맵 스크립트 로드 실패');
    };

    document.head.appendChild(script);
  }, []);

  // Create map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    try {
      const options = {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: zoom,
      };
      mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);
      setMapReady(true);
    } catch (e) {
      console.error('Failed to create map:', e);
      setError('지도 생성 실패');
    }
  }, [isLoaded, center.lat, center.lng, zoom]);

  // Move map to location
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !moveTo) return;

    const moveLatLng = new window.kakao.maps.LatLng(moveTo.lat, moveTo.lng);
    mapInstanceRef.current.setCenter(moveLatLng);
    mapInstanceRef.current.setLevel(MAP_ZOOM.ON_MOVE);
  }, [mapReady, moveTo]);

  // Preview pin
  useEffect(() => {
    // 기존 임시 핀 제거
    if (previewPinRef.current) {
      previewPinRef.current.setMap(null);
      previewPinRef.current = null;
    }

    if (!mapReady || !mapInstanceRef.current || !previewPosition) return;

    const position = new window.kakao.maps.LatLng(previewPosition.lat, previewPosition.lng);

    const pinEl = document.createElement('div');
    pinEl.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: previewBounce 0.4s ease-out;
      ">
        <div style="
          width: 28px;
          height: 28px;
          background: #EF4444;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div style="
          width: 8px;
          height: 8px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          margin-top: 2px;
        "></div>
      </div>
    `;

    // 바운스 애니메이션 스타일 삽입
    if (!document.getElementById('preview-pin-style')) {
      const style = document.createElement('style');
      style.id = 'preview-pin-style';
      style.textContent = `
        @keyframes previewBounce {
          0% { transform: translateY(-20px); opacity: 0; }
          60% { transform: translateY(4px); opacity: 1; }
          100% { transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    const overlay = new window.kakao.maps.CustomOverlay({
      position,
      content: pinEl,
      yAnchor: 1,
      xAnchor: 0.5,
    });

    overlay.setMap(mapInstanceRef.current);
    previewPinRef.current = overlay;
  }, [mapReady, previewPosition]);

  // Map click event
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !onMapClick) return;

    const clickHandler = (mouseEvent: any) => {
      // 마커 클릭 직후면 무시
      if (markerClickedRef.current) {
        markerClickedRef.current = false;
        return;
      }

      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();

      // services 라이브러리가 로드되었는지 확인
      if (window.kakao.maps.services?.Geocoder) {
        const geocoder = new window.kakao.maps.services.Geocoder();
        // 좌표로 주소 검색
        geocoder.coord2Address(lng, lat, (result: any, status: any) => {
          let address = '';
          if (status === window.kakao.maps.services.Status.OK && result[0]) {
            address = result[0].road_address?.address_name || result[0].address?.address_name || '';
          }
          onMapClick({ lat, lng, address });
        });
      } else {
        // services 없으면 주소 없이 전달
        onMapClick({ lat, lng });
      }
    };

    window.kakao.maps.event.addListener(mapInstanceRef.current, 'click', clickHandler);

    return () => {
      window.kakao.maps.event.removeListener(mapInstanceRef.current, 'click', clickHandler);
    };
  }, [mapReady, onMapClick]);

  // Render markers when map is ready
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.kakao?.maps) return;

    // Clear existing markers
    markerInstancesRef.current.forEach((marker) => marker.setMap(null));
    markerInstancesRef.current = [];

    // 같은 좌표의 마커들을 그룹화
    const groupedMarkers = new Map<string, Marker[]>();
    markers.forEach((marker) => {
      const key = coordKey(marker.latitude, marker.longitude);
      if (!groupedMarkers.has(key)) {
        groupedMarkers.set(key, []);
      }
      groupedMarkers.get(key)!.push(marker);
    });

    // 아이콘 생성 헬퍼 함수
    const getIcon = (placeType: string) => {
      if (placeType === 'RESTAURANT') {
        return `<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>`;
      } else if (placeType === 'KIDS_PLAYGROUND') {
        return `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`;
      } else if (placeType === 'RELAXATION') {
        return `<path d="M2 21h18v-2H2v2zm2-4h14V7H4v10zm4-8h6v6H8V9zm8 0h2v6h-2V9zM6 3h12v2H6V3z"/>`;
      } else if (placeType === 'MY_FOOTPRINT') {
        return `<path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>`;
      } else if (placeType === 'RECOMMENDED_RESTAURANT') {
        return `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`;
      } else {
        return `<path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/>`;
      }
    };

    groupedMarkers.forEach((markersAtLocation) => {
      const firstMarker = markersAtLocation[0];
      const position = new window.kakao.maps.LatLng(firstMarker.latitude, firstMarker.longitude);
      const isGroup = markersAtLocation.length > 1;

      const color = getMarkerColor(firstMarker.type as PlaceType, firstMarker.grade);
      const icon = getIcon(firstMarker.type);

      const content = document.createElement('div');

      if (isGroup) {
        // 그룹 마커: 숫자 뱃지 표시
        content.innerHTML = `
          <div style="
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
          ">
            <div style="
              width: 22px;
              height: 22px;
              background: linear-gradient(135deg, #6366F1, #8B5CF6);
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 11px;
              font-weight: bold;
            ">
              ${markersAtLocation.length}
            </div>
          </div>
        `;
      } else {
        // 단일 마커
        content.innerHTML = `
          <div style="
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 18px;
              height: 18px;
              background-color: ${color};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                ${icon}
              </svg>
            </div>
          </div>
        `;
      }

      content.style.cursor = 'pointer';
      content.onclick = (e) => {
        e.stopPropagation();
        markerClickedRef.current = true;
        const rect = content.getBoundingClientRect();
        onMarkerClick(markersAtLocation, {
          x: rect.right + 8,
          y: rect.top
        });
      };

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 0.5,
        xAnchor: 0.5,
      });

      customOverlay.setMap(mapInstanceRef.current);
      markerInstancesRef.current.push(customOverlay);
    });
  }, [mapReady, markers, onMarkerClick]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-gray-600">지도 로딩 중...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="h-full w-full" />;
}
