import { Category } from '../categories/category.entity';
export declare class Place {
    id: number;
    name: string;
    address: string;
    phone: string;
    opening_hours: string;
    lat: number;
    lng: number;
    osm_id: string;
    source: string;
    category: Category;
}
