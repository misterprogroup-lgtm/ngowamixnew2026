import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, UploadedFile, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto, UpdateAlbumDto, AddTrackToAlbumDto } from './dto/album.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Albums')
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cover', { storage: memoryStorage() }))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Créer un album' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAlbumDto,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    return this.albumsService.create(userId, dto, cover);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des albums' })
  findAll(@Query() pagination: PaginationDto) {
    return this.albumsService.findAll(pagination);
  }

  @Get('my-albums')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes albums (artiste)' })
  getMyAlbums(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.albumsService.getMyAlbums(userId, pagination);
  }

  @Get('my-purchases')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes achats d\'albums' })
  getMyPurchases(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.albumsService.getMyPurchases(userId, pagination);
  }

  @Get('album-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stats albums (artiste)' })
  getAlbumStats(@CurrentUser('id') userId: string) {
    return this.albumsService.getAlbumStats(userId);
  }

  @Get('top')
  @ApiOperation({ summary: 'Top albums (par nombre d\'achats)' })
  findTopAlbums(@Query() pagination: PaginationDto) {
    return this.albumsService.findTopAlbums(pagination);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Détails d\'un album' })
  findBySlug(@Param('slug') slug: string) {
    return this.albumsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cover', { storage: memoryStorage() }))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Modifier un album' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAlbumDto,
  ) {
    return this.albumsService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un album' })
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.albumsService.delete(userId, id);
  }

  @Post(':id/tracks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un morceau à l\'album' })
  addTrack(@CurrentUser('id') userId: string, @Param('id') albumId: string, @Body() dto: AddTrackToAlbumDto) {
    return this.albumsService.addTrack(userId, albumId, dto);
  }

  @Delete(':id/tracks/:trackId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirer un morceau de l\'album' })
  removeTrack(@CurrentUser('id') userId: string, @Param('id') albumId: string, @Param('trackId') trackId: string) {
    return this.albumsService.removeTrack(userId, albumId, trackId);
  }

  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acheter un album' })
  purchaseAlbum(@CurrentUser('id') userId: string, @Param('id') albumId: string) {
    return this.albumsService.purchaseAlbum(userId, albumId);
  }
}
