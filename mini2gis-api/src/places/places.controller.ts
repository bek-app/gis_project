import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PlacesService } from './places.service';

@ApiTags('places')
@Controller('places')
export class PlacesController {
  constructor(private readonly svc: PlacesService) {}

  @Get()
  @ApiQuery({ name: 'bbox', description: 'minLng,minLat,maxLng,maxLat', required: true })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('bbox') bbox: string, @Query('category') category?: string) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    return this.svc.findByBbox({ minLat, maxLat, minLng, maxLng, category });
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'bbox', description: 'minLng,minLat,maxLng,maxLat', required: true })
  search(@Query('q') q: string, @Query('bbox') bbox: string) {
    const parts = bbox.split(',').map(Number) as [number, number, number, number];
    return this.svc.search(q, parts);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const place = await this.svc.findOne(+id);
    if (!place) throw new NotFoundException();
    return place;
  }
}
