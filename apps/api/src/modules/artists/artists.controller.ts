import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ArtistsService } from './artists.service';
import { UpdateArtistDto } from './dto/create-artist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Artistes')
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des artistes' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() pagination: PaginationDto, @Query('search') search?: string) {
    return this.artistsService.findAll(pagination, search);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mon profil artiste' })
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.artistsService.getMyProfile(userId);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes stats artiste (top morceaux, écoutes, likes, auditeurs)' })
  getMyStats(@CurrentUser('id') userId: string) {
    return this.artistsService.getMyStats(userId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Profil public d\'un artiste par slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.artistsService.findBySlug(slug);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier mon profil artiste' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateArtistDto,
  ) {
    return this.artistsService.updateProfile(userId, dto);
  }
}
