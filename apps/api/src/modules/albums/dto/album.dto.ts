import { IsString, IsOptional, IsArray, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAlbumDto {
  @ApiProperty({ example: 'Mon Album' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Description de l\'album...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-07-19' })
  @IsOptional()
  @IsString()
  releaseDate?: string;

  @ApiPropertyOptional({ example: 2000, description: 'Prix en FCFA, 0 = gratuit' })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class UpdateAlbumDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  releaseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class AddTrackToAlbumDto {
  @ApiProperty()
  @IsString()
  trackId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  position?: number;
}

export class ReorderAlbumTracksDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  trackIds: string[];
}
