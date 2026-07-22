import { IsString, IsOptional, IsEnum, IsArray, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackVisibility } from '@prisma/client';

export class CreateTrackDto {
  @ApiProperty({ example: 'Mon Super Morceau' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Description du morceau...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Afrobeat' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ example: ['afro', 'pop', 'dance'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: TrackVisibility, default: TrackVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(TrackVisibility)
  visibility?: TrackVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExplicit?: boolean;
}

export class UpdateTrackDto {
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
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(TrackVisibility)
  visibility?: TrackVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExplicit?: boolean;
}
