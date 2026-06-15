import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Place } from './place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';

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
    if (category) qb.andWhere('c.slug = :category', { category });
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

  async create(dto: CreatePlaceDto) {
    const place = this.repo.create({
      name: dto.name,
      lat: dto.lat,
      lng: dto.lng,
      address: dto.address,
      phone: dto.phone,
      opening_hours: dto.opening_hours,
      source: 'admin',
      ...(dto.categoryId ? { category: { id: dto.categoryId } } : {}),
    });
    return this.repo.save(place);
  }

  async update(id: number, dto: Partial<CreatePlaceDto>) {
    const place = await this.repo.findOne({ where: { id } });
    if (!place) throw new NotFoundException();
    Object.assign(place, dto);
    if (dto.categoryId !== undefined) {
      (place as any).category = dto.categoryId ? { id: dto.categoryId } : null;
    }
    return this.repo.save(place);
  }

  async remove(id: number) {
    const place = await this.repo.findOne({ where: { id } });
    if (!place) throw new NotFoundException();
    await this.repo.remove(place);
    return { deleted: true };
  }
}
