export type PlaceType = 'RESTAURANT' | 'KIDS_PLAYGROUND' | 'RELAXATION';
export type Rating = 'GOOD' | 'AVERAGE' | 'BAD';

export interface Place {
  id: number;
  name: string;
  type: PlaceType;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  imageUrl?: string;
  grade?: number;
  googlePlaceId?: string;
  googleRating?: number;
  googleRatingsTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Memo {
  id: number;
  placeId: number;
  itemName: string;
  rating: Rating;
  comment?: string;
  createdAt: string;
}

export interface PlaceDetail extends Place {
  memos: Memo[];
}

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
