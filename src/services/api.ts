import { ApiResponse, Marker, Place, PlaceDetail, PlaceType } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data: ApiResponse<T> = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data as T;
}

export const placeApi = {
  getAll: (type?: PlaceType) => {
    const params = type ? `?type=${type}` : '';
    return fetchApi<Place[]>(`/api/places${params}`);
  },

  getById: (id: number) => {
    return fetchApi<PlaceDetail>(`/api/places/${id}`);
  },

  create: (place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>, password: string) => {
    return fetchApi<Place>('/api/places', {
      method: 'POST',
      body: JSON.stringify({ ...place, password }),
    });
  },

  update: (id: number, place: Partial<Place>, password: string) => {
    return fetchApi<Place>(`/api/places/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...place, password }),
    });
  },

  delete: (id: number, password: string) => {
    return fetchApi<void>(`/api/places/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  },
};

export const mapApi = {
  getMarkers: (params?: {
    type?: PlaceType;
    swLat?: number;
    swLng?: number;
    neLat?: number;
    neLng?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.swLat) searchParams.set('swLat', params.swLat.toString());
    if (params?.swLng) searchParams.set('swLng', params.swLng.toString());
    if (params?.neLat) searchParams.set('neLat', params.neLat.toString());
    if (params?.neLng) searchParams.set('neLng', params.neLng.toString());

    const query = searchParams.toString();
    return fetchApi<Marker[]>(`/api/map/markers${query ? `?${query}` : ''}`);
  },
};
