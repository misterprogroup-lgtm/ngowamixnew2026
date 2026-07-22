import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto, UpdatePlaylistDto, AddTrackToPlaylistDto } from './dto/playlist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Playlists')
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une playlist' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePlaylistDto) {
    return this.playlistsService.create(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes playlists' })
  getMyPlaylists(@CurrentUser('id') userId: string) {
    return this.playlistsService.getMyPlaylists(userId);
  }

  @Get('public')
  @ApiOperation({ summary: 'Playlists publiques' })
  findPublic(@Query() pagination: PaginationDto) {
    return this.playlistsService.findPublic(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une playlist' })
  findById(@Param('id') id: string) {
    return this.playlistsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une playlist' })
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdatePlaylistDto) {
    return this.playlistsService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une playlist' })
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.playlistsService.delete(userId, id);
  }

  @Post(':id/tracks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un morceau à la playlist' })
  addTrack(@CurrentUser('id') userId: string, @Param('id') playlistId: string, @Body() dto: AddTrackToPlaylistDto) {
    return this.playlistsService.addTrack(userId, playlistId, dto);
  }

  @Delete(':id/tracks/:trackId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirer un morceau de la playlist' })
  removeTrack(@CurrentUser('id') userId: string, @Param('id') playlistId: string, @Param('trackId') trackId: string) {
    return this.playlistsService.removeTrack(userId, playlistId, trackId);
  }
}
