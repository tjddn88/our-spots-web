declare namespace naver.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    setCenter(latlng: LatLng): void;
    setZoom(zoom: number): void;
    getCenter(): LatLng;
    getBounds(): LatLngBounds;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class LatLngBounds {
    constructor(sw: LatLng, ne: LatLng);
    getSW(): LatLng;
    getNE(): LatLng;
  }

  class Point {
    constructor(x: number, y: number);
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
  }

  interface MapOptions {
    center?: LatLng;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    title?: string;
    icon?: string | ImageIcon | SymbolIcon | HtmlIcon;
  }

  interface ImageIcon {
    url: string;
    size?: Size;
    origin?: Point;
    anchor?: Point;
  }

  interface SymbolIcon {
    path: string;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
    scale?: number;
  }

  interface HtmlIcon {
    content: string;
    anchor?: Point;
  }

  class Size {
    constructor(width: number, height: number);
  }

  namespace Event {
    function addListener(target: object, type: string, listener: Function): void;
    function removeListener(listener: object): void;
  }
}
