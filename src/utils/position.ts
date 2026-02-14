import { PANEL_DIMENSIONS } from '@/constants/placeConfig';

interface ClampOptions {
  width: number;
  height: number;
  margin?: number;
  headerHeight?: number;
  /** 우측 초과 시 마커 왼쪽으로 배치할 오프셋 (예: 50 or 60) */
  leftFallbackOffset?: number;
}

export function clampPosition(
  position: { x: number; y: number },
  { width, height, margin = PANEL_DIMENSIONS.MARGIN, headerHeight = PANEL_DIMENSIONS.HEADER_HEIGHT, leftFallbackOffset = 50 }: ClampOptions,
): { x: number; y: number } {
  let x = position.x;
  let y = position.y;

  // 우측 경계: 패널이 화면 밖으로 나가면 마커 왼쪽에 표시
  if (x + width + margin > window.innerWidth) {
    x = position.x - width - leftFallbackOffset;
  }

  // 좌측 경계
  if (x < margin) {
    x = margin;
  }

  // 하단 경계
  if (y + height + margin > window.innerHeight) {
    y = Math.max(margin, window.innerHeight - height - margin);
  }

  // 상단 경계
  if (y < headerHeight) {
    y = headerHeight;
  }

  return { x, y };
}
