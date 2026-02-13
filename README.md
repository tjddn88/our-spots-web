# Our Spots Web

> 우리 가족의 맛집/명소 추천 서비스 — 프론트엔드

가족이 함께 다녀온 맛집, 아이 놀이터, 추천 명소를 지도 위에 기록하고 공유하는 서비스입니다.

🔗 **[ourspots.life](https://ourspots.life)**

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16, React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Map | Kakao Maps SDK |

## 주요 기능

- 카카오맵 기반 장소 표시 (타입별 색상 마커, 등급별 색상 구분)
- 장소 검색 (현재 지도 범위 내 카카오 키워드 검색, 재검색 버튼)
- 장소 등록/수정/삭제 (검색 → 미리보기 → 등록 플로우)
- 카테고리 필터 (공개 3타입 + 개인 3타입, 등급 필터)
- 같은 좌표 장소 그룹 마커 (보라색 원 + 숫자 뱃지)
- 장소 상세 (주소 복사, 구글 리뷰/네이버 검색 링크)
- JWT 관리자 인증 (로그인/로그아웃, 토큰 만료 자동 감지)
- 반응형 UI (데스크탑 패널 + 모바일 드래그 시트)

## 스크린샷

> 추가 예정

## 실행 방법

### 사전 준비

- Node.js 18+
- [our-spots-api](https://github.com/tjddn88/our-spots-api) 백엔드 서버 실행

### 환경변수

프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=your_kakao_js_key
```

카카오 키는 [Kakao Developers](https://developers.kakao.com/)에서 발급받을 수 있습니다.

### 실행

```bash
git clone https://github.com/tjddn88/our-spots-web.git
cd our-spots-web
npm install
npm run build && npm run start
```

`http://localhost:3000`에서 실행됩니다.

> ⚠️ `npm run dev` 대신 `npm run build && npm run start`를 사용하세요. `dev`는 타입 에러를 일부 무시합니다.

## 프로젝트 구조

```
src/
├── app/           # 페이지 (layout.tsx, page.tsx)
├── components/    # UI 컴포넌트
│   ├── KakaoMap/  # 지도 (마커, 오버레이)
│   └── ...        # PlaceForm, PlaceDetail, SearchResultsPanel 등
├── constants/     # 타입/등급/색상 설정 (placeConfig.ts)
├── hooks/         # 커스텀 훅 (useAuth, useMarkerFilter, useMapSearch 등)
├── services/      # API 통신 (api.ts)
└── types/         # TypeScript 타입 정의
```

## 관련 프로젝트

- [our-spots-api](https://github.com/tjddn88/our-spots-api) — 백엔드 API (Spring Boot)
