'use client';

import { useEffect, useState } from 'react';

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY || '';

export function useKakaoSDK() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      (window as { kakao?: KakaoNamespace }).kakao = undefined as unknown as KakaoNamespace;
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

  return { isLoaded, error };
}
