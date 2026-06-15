import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }
}
