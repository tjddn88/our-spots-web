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
  onMarkerClick: (marker: Marker) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const MARKER_COLORS: Record<PlaceType, string> = {
  RESTAURANT: '#EF4444',
  ATTRACTION: '#3B82F6',
};

const KAKAO_APP_KEY = '0ee6d04f5dfd4574416c359d9ccbda7c';

export default function KakaoMap({
  markers,
  onMarkerClick,
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 5,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstancesRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.kakao?.maps?.Map) {
      setIsLoaded(true);
      return;
    }

    // Load Kakao Maps script
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`;
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

    return () => {
      // Don't remove script on unmount to avoid reloading
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const options = {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: zoom,
      };
      mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);
    } catch (e) {
      console.error('Failed to create map:', e);
      setError('지도 생성 실패');
    }
  }, [isLoaded, center.lat, center.lng, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.kakao?.maps) return;

    markerInstancesRef.current.forEach((marker) => marker.setMap(null));
    markerInstancesRef.current = [];

    markers.forEach((markerData) => {
      const position = new window.kakao.maps.LatLng(markerData.latitude, markerData.longitude);

      const content = document.createElement('div');
      content.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background-color: ${MARKER_COLORS[markerData.type]};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
        ">
          ${markerData.type === 'RESTAURANT' ? '🍽️' : '📍'}
        </div>
      `;
      content.style.cursor = 'pointer';
      content.onclick = () => onMarkerClick(markerData);

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 0.5,
        xAnchor: 0.5,
      });

      customOverlay.setMap(mapInstanceRef.current);
      markerInstancesRef.current.push(customOverlay);
    });
  }, [markers, onMarkerClick]);

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
