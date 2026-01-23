'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker, PlaceType } from '@/types';

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  markers: Marker[];
  onMarkerClick: (marker: Marker, position: { x: number; y: number }) => void;
  onMapClick?: (latlng: { lat: number; lng: number; address?: string }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  moveTo?: { lat: number; lng: number } | null;
}

const KAKAO_APP_KEY = '0ee6d04f5dfd4574416c359d9ccbda7c';

// 타입별 등급 색상
const TYPE_GRADE_COLORS = {
  RESTAURANT: {
    1: '#DC2626', // 진빨강
    2: '#F87171', // 빨강
    3: '#FCA5A5', // 연빨강
  },
  KIDS_PLAYGROUND: {
    1: '#DB2777', // 진분홍
    2: '#F472B6', // 분홍
    3: '#FBCFE8', // 연분홍
  },
  RELAXATION: {
    1: '#4F46E5', // 진인디고
    2: '#818CF8', // 인디고
    3: '#C7D2FE', // 연인디고
  },
} as const;

// 기본 색상 (등급 없을 때)
const DEFAULT_COLOR = '#9CA3AF';

export default function KakaoMap({
  markers,
  onMarkerClick,
  onMapClick,
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 3,
  moveTo,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstancesRef = useRef<any[]>([]);
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
    mapInstanceRef.current.setLevel(3); // 줌 레벨 3으로 확대
  }, [mapReady, moveTo]);

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

    markers.forEach((markerData) => {
      const position = new window.kakao.maps.LatLng(markerData.latitude, markerData.longitude);
      const placeType = markerData.type as keyof typeof TYPE_GRADE_COLORS;

      // 색상 결정
      const typeColors = TYPE_GRADE_COLORS[placeType];
      const grade = markerData.grade as 1 | 2 | 3 | undefined;
      const color = typeColors && grade ? typeColors[grade] : DEFAULT_COLOR;

      // 아이콘 결정
      let icon: string;
      if (placeType === 'RESTAURANT') {
        // 맛집: 포크 & 나이프
        icon = `<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>`;
      } else if (placeType === 'KIDS_PLAYGROUND') {
        // 아이 놀이터: 하트
        icon = `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`;
      } else {
        // 아빠의 쉼터: 커피잔
        icon = `<path d="M2 21h18v-2H2v2zm2-4h14V7H4v10zm4-8h6v6H8V9zm8 0h2v6h-2V9zM6 3h12v2H6V3z"/>`;
      }

      const content = document.createElement('div');
      content.innerHTML = `
        <div style="
          width: 18px;
          height: 18px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            ${icon}
          </svg>
        </div>
      `;
      content.style.cursor = 'pointer';
      content.onclick = (e) => {
        e.stopPropagation();
        markerClickedRef.current = true; // 마커 클릭 플래그 설정
        const rect = content.getBoundingClientRect();
        onMarkerClick(markerData, {
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
