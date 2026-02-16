import { PANEL_DIMENSIONS } from '@/constants/placeConfig';

interface ClampOptions {
  width: number;
  height: number;
  margin?: number;
  headerHeight?: number;
  /** 마커의 화면 중심점 (겹침 방지용) */
  markerCenter?: { x: number; y: number; w: number; h: number };
}

export function clampPosition(
  position: { x: number; y: number },
  { width, height, margin = PANEL_DIMENSIONS.MARGIN, headerHeight = PANEL_DIMENSIONS.HEADER_HEIGHT, markerCenter }: ClampOptions,
): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = position.x;
  let y = position.y;

  // 우측 경계: 패널이 화면 밖으로 나가면 마커 왼쪽에 표시
  if (x + width + margin > vw) {
    x = position.x - width - (markerCenter?.w ?? 50);
  }

  // 좌측 경계
  if (x < margin) {
    x = margin;
  }

  // 하단 경계
  if (y + height + margin > vh) {
    y = Math.max(headerHeight, vh - height - margin);
  }

  // 상단 경계
  if (y < headerHeight) {
    y = headerHeight;
  }

  // 마커 겹침 방지: 패널이 마커 영역과 겹치면 마커 아래로 이동
  if (markerCenter) {
    const markerLeft = markerCenter.x - markerCenter.w / 2;
    const markerRight = markerCenter.x + markerCenter.w / 2;
    const markerTop = markerCenter.y - markerCenter.h / 2;
    const markerBottom = markerCenter.y + markerCenter.h / 2;

    const panelRight = x + width;
    const panelBottom = y + height;

    const overlapsX = x < markerRight && panelRight > markerLeft;
    const overlapsY = y < markerBottom && panelBottom > markerTop;

    if (overlapsX && overlapsY) {
      // 마커 아래에 공간이 있으면 아래로
      if (markerBottom + height + margin <= vh) {
        y = markerBottom + 8;
      } else if (markerTop - height - 8 >= headerHeight) {
        // 마커 위에 공간이 있으면 위로
        y = markerTop - height - 8;
      }
      // 좌우 중앙 정렬
      x = Math.max(margin, Math.min(markerCenter.x - width / 2, vw - width - margin));
    }
  }

  return { x, y };
}
