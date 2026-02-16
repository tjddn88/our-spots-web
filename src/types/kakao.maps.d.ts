/** Kakao Maps SDK 타입 선언 */

interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoLatLngBounds {
  getSouthWest(): KakaoLatLng;
  getNorthEast(): KakaoLatLng;
}

interface KakaoPoint {
  x: number;
  y: number;
}

interface KakaoProjection {
  containerPointFromCoords(latlng: KakaoLatLng): KakaoPoint;
}

interface KakaoMapInstance {
  setCenter(latlng: KakaoLatLng): void;
  getCenter(): KakaoLatLng;
  setLevel(level: number): void;
  getLevel(): number;
  getBounds(): KakaoLatLngBounds;
  getProjection(): KakaoProjection;
}

interface KakaoCustomOverlayOptions {
  position: KakaoLatLng;
  content: HTMLElement | string;
  yAnchor?: number;
  xAnchor?: number;
}

interface KakaoCustomOverlay {
  setMap(map: KakaoMapInstance | null): void;
}

interface KakaoGeocoderResult {
  road_address?: { address_name: string };
  address?: { address_name: string };
  x: string;
  y: string;
}

interface KakaoPlaceSearchResult {
  place_name: string;
  address_name: string;
  road_address_name?: string;
  category_group_name?: string;
  phone?: string;
  x: string;
  y: string;
}

interface KakaoGeocoder {
  addressSearch(query: string, callback: (result: KakaoGeocoderResult[], status: string) => void): void;
  coord2Address(lng: number, lat: number, callback: (result: KakaoGeocoderResult[], status: string) => void): void;
}

interface KakaoPlaces {
  keywordSearch(
    keyword: string,
    callback: (data: KakaoPlaceSearchResult[], status: string) => void,
    options?: Record<string, unknown>,
  ): void;
}

interface KakaoMapsServices {
  Geocoder: new () => KakaoGeocoder;
  Places: new () => KakaoPlaces;
  Status: { OK: string; ZERO_RESULT: string; ERROR: string };
  SortBy: { DISTANCE: string; ACCURACY: string };
}

interface KakaoMapsEvent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener(target: KakaoMapInstance, type: string, handler: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeListener(target: KakaoMapInstance, type: string, handler: (...args: any[]) => void): void;
}

interface KakaoMaps {
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
  services?: KakaoMapsServices;
  event: KakaoMapsEvent;
  load(callback: () => void): void;
}

interface KakaoNamespace {
  maps: KakaoMaps;
}

interface Window {
  kakao: KakaoNamespace;
}
