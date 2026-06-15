import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreatePlaceDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() lat: number;
  @IsNumber() lng: number;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() opening_hours?: string;
  @IsNumber() @IsOptional() categoryId?: number;
}
