export interface Category {
  id: number;
  slug: string;
  name: string;
  icon?: string;
}

export interface Place {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  opening_hours?: string;
  lat: number;
  lng: number;
  category?: Category;
  osm_id?: string;
}
