import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
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

  findByBbox({ minLat, maxLat, minLng, maxLng, category, limit = 300 }: BboxQuery) {
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

  search(q: string, bbox: [number, number, number, number], limit = 50) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    return this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.lat BETWEEN :minLat AND :maxLat', { minLat, maxLat })
      .andWhere('p.lng BETWEEN :minLng AND :maxLng', { minLng, maxLng })
      .andWhere('p.name ILIKE :q', { q: `%${q}%` })
      .limit(limit)
      .getMany();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: { category: true } });
  }
}
