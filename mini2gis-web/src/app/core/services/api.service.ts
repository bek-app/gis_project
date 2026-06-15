import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Category, Place } from '../models/place.model';

const API = 'http://localhost:3000';

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

  searchPlaces(query: string, bbox: [number, number, number, number]) {
    let params = new HttpParams().set('bbox', bbox.join(',')).set('q', query);
    return this.http.get<Place[]>(`${API}/places/search`, { params });
  }
}
