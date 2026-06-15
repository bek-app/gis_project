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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const place = await this.svc.findOne(+id);
    if (!place) throw new NotFoundException();
    return place;
  }
}
