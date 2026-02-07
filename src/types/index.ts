export type PlaceType = 'RESTAURANT' | 'KIDS_PLAYGROUND' | 'RELAXATION'
  | 'MY_FOOTPRINT' | 'RECOMMENDED_RESTAURANT' | 'RECOMMENDED_SPOT';

export interface Place {
  id: number;
  name: string;
  type: PlaceType;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  grade?: number;
  googlePlaceId?: string;
  googleRating?: number;
  googleRatingsTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export type PlaceDetail = Place;

export interface Marker {
  id: number;
  name: string;
  type: PlaceType;
  latitude: number;
  longitude: number;
  grade?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
