import { PlacesService } from './places.service';
export declare class PlacesController {
    private readonly svc;
    constructor(svc: PlacesService);
    findAll(bbox: string, category?: string): Promise<import("./place.entity").Place[]>;
    findOne(id: string): Promise<import("./place.entity").Place>;
}
