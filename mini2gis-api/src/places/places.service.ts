import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class PlacesService {
  constructor(@InjectRepository(Place) private repo: Repository<Place>) {}

  findByBbox({ minLat, maxLat, minLng, maxLng, category, limit = 200 }: BboxQuery) {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.lat BETWEEN :minLat AND :maxLat', { minLat, maxLat })
      .andWhere('p.lng BETWEEN :minLng AND :maxLng', { minLng, maxLng })
      .limit(limit);

    if (category) {
      qb.andWhere('c.slug = :category', { category });
    }

    return qb.getMany();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: { category: true } });
  }
}
