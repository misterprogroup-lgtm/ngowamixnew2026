import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArtistDto {
  @ApiProperty({ example: 'Mon Nom d\'Artiste' })
  @IsString()
  artistName: string;

  @ApiPropertyOptional({ example: 'Description de l\'artiste...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: ['Afrobeat', 'Pop', 'R&B'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({ example: { instagram: 'https://instagram.com/...', twitter: 'https://twitter.com/...' } })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;
}

export class UpdateArtistDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  artistName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}
