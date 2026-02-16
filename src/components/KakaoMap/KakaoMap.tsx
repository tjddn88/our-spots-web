'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Marker, SearchResultPlace } from '@/types';
import { MAP_ZOOM, DEFAULT_CENTER, MAP_SETTLE_MS } from '@/constants/placeConfig';
import { useKakaoSDK } from '@/hooks/useKakaoSDK';
import { groupMarkersByCoord, createSingleMarkerHTML, createGroupMarkerHTML, createSearchMarkerHTML } from './markerUtils';

interface KakaoMapProps {
  markers: Marker[];
  onMarkerClick: (markers: Marker[], position: { x: number; y: number; markerCenter?: { x: number; y: number; w: number; h: number } }) => void;
  onMapClick?: (latlng: { lat: number; lng: number; address?: string }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  moveTo?: { lat: number; lng: number; zoom?: number } | null;
  previewPosition?: { lat: number; lng: number } | null;
  highlightPosition?: { lat: number; lng: number } | null;
  searchResults?: SearchResultPlace[];
  onSearchMarkerClick?: (result: SearchResultPlace) => void;
  onMapMoved?: () => void;
}

export interface KakaoMapHandle {
  getBounds: () => { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null;
  getCenter: () => { lat: number; lng: number } | null;
  coordToScreenPosition: (lat: number, lng: number) => { x: number; y: number } | null;
}

const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap({
  markers,
  onMarkerClick,
  onMapClick,
  center = DEFAULT_CENTER,
  zoom = MAP_ZOOM.DEFAULT,
  moveTo,
  previewPosition,
  highlightPosition,
  searchResults = [],
  onSearchMarkerClick,
  onMapMoved,
}, ref) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMapInstance | null>(null);
  const markerInstancesRef = useRef<KakaoCustomOverlay[]>([]);
  const searchMarkerInstancesRef = useRef<KakaoCustomOverlay[]>([]);
  const previewPinRef = useRef<KakaoCustomOverlay | null>(null);
  const highlightPinRef = useRef<KakaoCustomOverlay | null>(null);
  const markerClickedRef = useRef(false);
  const programmaticMoveRef = useRef(false);
  const onMapMovedRef = useRef(onMapMoved);
  onMapMovedRef.current = onMapMoved;
  const [mapReady, setMapReady] = useState(false);
  const { isLoaded, error } = useKakaoSDK();

  useImperativeHandle(ref, () => ({
    getBounds: () => {
      if (!mapInstanceRef.current) return null;
      const bounds = mapInstanceRef.current.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      return {
        sw: { lat: sw.getLat(), lng: sw.getLng() },
        ne: { lat: ne.getLat(), lng: ne.getLng() },
      };
    },
    getCenter: () => {
      if (!mapInstanceRef.current) return null;
      const center = mapInstanceRef.current.getCenter();
      return { lat: center.getLat(), lng: center.getLng() };
    },
    coordToScreenPosition: (lat: number, lng: number) => {
      if (!mapInstanceRef.current) return null;
      const projection = mapInstanceRef.current.getProjection();
      const latlng = new window.kakao.maps.LatLng(lat, lng);
      const point = projection.containerPointFromCoords(latlng);
      const mapEl = mapRef.current;
      if (!mapEl) return null;
      const rect = mapEl.getBoundingClientRect();
      return { x: rect.left + point.x, y: rect.top + point.y };
    },
  }));

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
    }
  }, [isLoaded, center.lat, center.lng, zoom]);

  // Move map to location
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !moveTo) return;

    programmaticMoveRef.current = true;
    const moveLatLng = new window.kakao.maps.LatLng(moveTo.lat, moveTo.lng);
    mapInstanceRef.current.setCenter(moveLatLng);
    mapInstanceRef.current.setLevel(moveTo.zoom ?? MAP_ZOOM.ON_MOVE);
    const timer = setTimeout(() => { programmaticMoveRef.current = false; }, MAP_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [mapReady, moveTo]);

  // Preview pin
  useEffect(() => {
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

    return () => {
      overlay.setMap(null);
      previewPinRef.current = null;
      document.getElementById('preview-pin-style')?.remove();
    };
  }, [mapReady, previewPosition]);

  // Highlight pin (deep link)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !highlightPosition) return;

    const position = new window.kakao.maps.LatLng(highlightPosition.lat, highlightPosition.lng);

    const pinEl = document.createElement('div');
    pinEl.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: highlightBounce 0.5s ease-out;
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: #2563EB;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 12px rgba(37,99,235,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div style="
          width: 10px;
          height: 10px;
          background: rgba(37,99,235,0.25);
          border-radius: 50%;
          margin-top: 2px;
        "></div>
      </div>
    `;

    if (!document.getElementById('highlight-pin-style')) {
      const style = document.createElement('style');
      style.id = 'highlight-pin-style';
      style.textContent = `
        @keyframes highlightBounce {
          0% { transform: translateY(-30px); opacity: 0; }
          60% { transform: translateY(5px); opacity: 1; }
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
    highlightPinRef.current = overlay;

    return () => {
      overlay.setMap(null);
      highlightPinRef.current = null;
      document.getElementById('highlight-pin-style')?.remove();
    };
  }, [mapReady, highlightPosition]);

  // Map click event
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !onMapClick) return;

    const clickHandler = (mouseEvent: { latLng: KakaoLatLng }) => {
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
        geocoder.coord2Address(lng, lat, (result: KakaoGeocoderResult[], status: string) => {
          let address = '';
          if (status === window.kakao.maps.services!.Status.OK && result[0]) {
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

    const mapInstance = mapInstanceRef.current;
    return () => {
      window.kakao.maps.event.removeListener(mapInstance, 'click', clickHandler);
    };
  }, [mapReady, onMapClick]);

  // Map moved events (dragend, zoom_changed) — 사용자 조작 시만
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    let timer: ReturnType<typeof setTimeout>;

    const handleMoved = () => {
      if (programmaticMoveRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        onMapMovedRef.current?.();
      }, 300);
    };

    const mapInstance = mapInstanceRef.current;
    window.kakao.maps.event.addListener(mapInstance, 'dragend', handleMoved);
    window.kakao.maps.event.addListener(mapInstance, 'zoom_changed', handleMoved);

    return () => {
      clearTimeout(timer);
      window.kakao.maps.event.removeListener(mapInstance, 'dragend', handleMoved);
      window.kakao.maps.event.removeListener(mapInstance, 'zoom_changed', handleMoved);
    };
  }, [mapReady]);

  // Render registered markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.kakao?.maps) return;

    // Clear existing markers
    markerInstancesRef.current.forEach((marker) => marker.setMap(null));
    markerInstancesRef.current = [];

    const groupedMarkers = groupMarkersByCoord(markers);

    groupedMarkers.forEach((markersAtLocation) => {
      const firstMarker = markersAtLocation[0];
      const position = new window.kakao.maps.LatLng(firstMarker.latitude, firstMarker.longitude);
      const isGroup = markersAtLocation.length > 1;

      const content = document.createElement('div');
      content.innerHTML = isGroup
        ? createGroupMarkerHTML(markersAtLocation.length)
        : createSingleMarkerHTML(firstMarker);

      content.style.cursor = 'pointer';
      content.onclick = (e) => {
        e.stopPropagation();
        markerClickedRef.current = true;
        const rect = content.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        onMarkerClick(markersAtLocation, {
          x: rect.right + 8,
          y: rect.top,
          markerCenter: { x: cx, y: cy, w: rect.width + 16, h: rect.height + 16 },
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

  // Render search result markers (A, B, C...)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.kakao?.maps) return;

    // Clear existing search markers
    searchMarkerInstancesRef.current.forEach((marker) => marker.setMap(null));
    searchMarkerInstancesRef.current = [];

    searchResults.forEach((result) => {
      const position = new window.kakao.maps.LatLng(result.lat, result.lng);

      const content = document.createElement('div');
      content.innerHTML = createSearchMarkerHTML(result.label);
      content.style.cursor = 'pointer';
      content.onclick = (e) => {
        e.stopPropagation();
        markerClickedRef.current = true;
        onSearchMarkerClick?.(result);
      };

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 1,
        xAnchor: 0.5,
      });

      customOverlay.setMap(mapInstanceRef.current);
      searchMarkerInstancesRef.current.push(customOverlay);
    });
  }, [mapReady, searchResults, onSearchMarkerClick]);

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
});

export default KakaoMap;
