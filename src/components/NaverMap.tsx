'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker, PlaceType } from '@/types';

declare global {
  interface Window {
    naver: typeof naver;
  }
}

interface NaverMapProps {
  markers: Marker[];
  onMarkerClick: (marker: Marker) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const MARKER_COLORS: Record<PlaceType, string> = {
  RESTAURANT: '#EF4444',
  ATTRACTION: '#3B82F6',
};

export default function NaverMap({
  markers,
  onMarkerClick,
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 14,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markerInstancesRef = useRef<naver.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    if (!clientId || clientId === 'YOUR_NAVER_MAP_CLIENT_ID') {
      console.warn('Naver Map Client ID is not set');
      return;
    }

    if (window.naver?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.naver?.maps) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom,
      });
    }
  }, [isLoaded, center.lat, center.lng, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.naver?.maps) return;

    markerInstancesRef.current.forEach((marker) => marker.setMap(null));
    markerInstancesRef.current = [];

    markers.forEach((markerData) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(markerData.latitude, markerData.longitude),
        map: mapInstanceRef.current!,
        title: markerData.name,
        icon: {
          content: `
            <div style="
              width: 32px;
              height: 32px;
              background-color: ${MARKER_COLORS[markerData.type]};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
            ">
              ${markerData.type === 'RESTAURANT' ? '🍽️' : '📍'}
            </div>
          `,
          anchor: new window.naver.maps.Point(16, 16),
        },
      });

      window.naver.maps.Event.addListener(marker, 'click', () => {
        onMarkerClick(markerData);
      });

      markerInstancesRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId || clientId === 'YOUR_NAVER_MAP_CLIENT_ID') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-2">네이버 지도 API 키가 필요합니다</p>
          <p className="text-sm text-gray-400">
            .env.local 파일에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정해주세요
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="h-full w-full" />;
}
