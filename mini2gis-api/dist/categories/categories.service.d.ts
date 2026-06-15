import { Repository } from 'typeorm';
import { Category } from './category.entity';
export declare class CategoriesService {
    private repo;
    constructor(repo: Repository<Category>);
    findAll(): Promise<Category[]>;
    findBySlug(slug: string): Promise<Category | null>;
}
