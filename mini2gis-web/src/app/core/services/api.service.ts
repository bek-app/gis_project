import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Category, Place } from '../models/place.model';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

export interface PlacePayload {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  opening_hours?: string;
  categoryId?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getCategories() {
    return this.http.get<Category[]>(`${API}/categories`);
  }

  getPlaces(bbox: [number, number, number, number], category?: string) {
    let params = new HttpParams().set('bbox', bbox.join(','));
    if (category) params = params.set('category', category);
    return this.http.get<Place[]>(`${API}/places`, { params });
  }

  getPlace(id: number) {
    return this.http.get<Place>(`${API}/places/${id}`);
  }

  searchPlaces(q: string, bbox: [number, number, number, number]) {
    const params = new HttpParams().set('bbox', bbox.join(',')).set('q', q);
    return this.http.get<Place[]>(`${API}/places/search`, { params });
  }

  createPlace(payload: PlacePayload) {
    return this.http.post<Place>(`${API}/places`, payload);
  }

  updatePlace(id: number, payload: Partial<PlacePayload>) {
    return this.http.put<Place>(`${API}/places/${id}`, payload);
  }

  deletePlace(id: number) {
    return this.http.delete(`${API}/places/${id}`);
  }

  geocode(query: string) {
    const params = new HttpParams()
      .set('q', `${query}, Астана, Қазақстан`)
      .set('format', 'json')
      .set('limit', '5')
      .set('bounded', '1')
      .set('viewbox', '71.0,51.5,72.2,51.0');
    return this.http.get<{ lat: string; lon: string; display_name: string }[]>(
      'https://nominatim.openstreetmap.org/search',
      { params, headers: { 'Accept-Language': 'ru,kk' } },
    );
  }
}
