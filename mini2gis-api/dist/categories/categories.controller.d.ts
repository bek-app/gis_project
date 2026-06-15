import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly svc;
    constructor(svc: CategoriesService);
    findAll(): Promise<import("./category.entity").Category[]>;
}
