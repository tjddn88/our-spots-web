'use client';

import { useEffect, useState } from 'react';

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY || '';

// 모듈 레벨 싱글톤: 여러 컴포넌트에서 호출해도 SDK는 단 한 번만 로드
type LoadState = 'idle' | 'loading' | 'loaded' | 'error';
let loadState: LoadState = 'idle';
let errorMessage: string | null = null;
const callbacks: Set<() => void> = new Set();

function initKakaoSDK() {
  if (loadState !== 'idle') return;
  loadState = 'loading';

  const script = document.createElement('script');
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services`;
  script.async = true;

  script.onload = () => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => {
        loadState = 'loaded';
        callbacks.forEach((cb) => cb());
        callbacks.clear();
      });
    } else {
      loadState = 'error';
      errorMessage = '카카오맵 SDK 로드 실패';
      callbacks.forEach((cb) => cb());
      callbacks.clear();
    }
  };

  script.onerror = () => {
    loadState = 'error';
    errorMessage = '카카오맵 스크립트 로드 실패';
    callbacks.forEach((cb) => cb());
    callbacks.clear();
  };

  document.head.appendChild(script);
}

export function useKakaoSDK() {
  const [isLoaded, setIsLoaded] = useState(() => loadState === 'loaded');
  const [error, setError] = useState<string | null>(() =>
    loadState === 'error' ? errorMessage : null
  );

  useEffect(() => {
    if (loadState === 'loaded') {
      setIsLoaded(true);
      return;
    }
    if (loadState === 'error') {
      setError(errorMessage);
      return;
    }

    const onDone = () => {
      if (loadState === 'loaded') setIsLoaded(true);
      else setError(errorMessage);
    };
    callbacks.add(onDone);

    initKakaoSDK();

    return () => { callbacks.delete(onDone); };
  }, []);

  return { isLoaded, error };
}
