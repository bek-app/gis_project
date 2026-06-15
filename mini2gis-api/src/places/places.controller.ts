import {
  Body, Controller, Delete, Get, NotFoundException,
  Param, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePlaceDto } from './dto/create-place.dto';
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
  @ApiQuery({ name: 'bbox', required: true })
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

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  create(@Body() dto: CreatePlaceDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: CreatePlaceDto) {
    return this.svc.update(+id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.svc.remove(+id);
  }
}
