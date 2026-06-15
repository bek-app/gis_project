import { Repository } from 'typeorm';
import { Place } from './place.entity';
export interface BboxQuery {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    category?: string;
    limit?: number;
}
export declare class PlacesService {
    private repo;
    constructor(repo: Repository<Place>);
    findByBbox({ minLat, maxLat, minLng, maxLng, category, limit }: BboxQuery): Promise<Place[]>;
    findOne(id: number): Promise<Place | null>;
}
