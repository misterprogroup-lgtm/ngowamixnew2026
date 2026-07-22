import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaylistDto, UpdatePlaylistDto, AddTrackToPlaylistDto } from './dto/playlist.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PlaylistsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePlaylistDto) {
    return this.prisma.playlist.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
      },
    });
  }

  async getMyPlaylists(userId: string) {
    return this.prisma.playlist.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { playlistTracks: true } } },
    });
  }

  async findPublic(pagination: PaginationDto) {
    const { skip, limit } = pagination;
    const [playlists, total] = await Promise.all([
      this.prisma.playlist.findMany({
        where: { isPublic: true },
        skip,
        take: limit,
        orderBy: { trackCount: 'desc' },
        include: { user: { select: { pseudo: true, avatarUrl: true } } },
      }),
      this.prisma.playlist.count({ where: { isPublic: true } }),
    ]);
    return { data: playlists, meta: { total, page: pagination.page, limit: pagination.limit } };
  }

  async findById(playlistId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        user: { select: { pseudo: true, avatarUrl: true } },
        playlistTracks: {
          include: { track: { include: { artist: { select: { artistName: true, slug: true } } } } },
          orderBy: { position: 'asc' },
        },
      },
    });
    if (!playlist) throw new NotFoundException('Playlist non trouvée');
    return playlist;
  }

  async update(userId: string, playlistId: string, dto: UpdatePlaylistDto) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) throw new NotFoundException('Playlist non trouvée');
    if (playlist.userId !== userId) throw new ForbiddenException('Non autorisé');

    return this.prisma.playlist.update({
      where: { id: playlistId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });
  }

  async delete(userId: string, playlistId: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) throw new NotFoundException('Playlist non trouvée');
    if (playlist.userId !== userId) throw new ForbiddenException('Non autorisé');
    await this.prisma.playlist.delete({ where: { id: playlistId } });
    return { message: 'Playlist supprimée' };
  }

  async addTrack(userId: string, playlistId: string, dto: AddTrackToPlaylistDto) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) throw new NotFoundException('Playlist non trouvée');
    if (playlist.userId !== userId) throw new ForbiddenException('Non autorisé');

    const existing = await this.prisma.playlistTrack.findUnique({
      where: { playlistId_trackId: { playlistId, trackId: dto.trackId } },
    });
    if (existing) throw new BadRequestException('Ce morceau est déjà dans la playlist');

    const maxPos = await this.prisma.playlistTrack.aggregate({ where: { playlistId }, _max: { position: true } });
    const position = dto.position ?? (maxPos._max.position ?? -1) + 1;

    await this.prisma.$transaction([
      this.prisma.playlistTrack.create({ data: { playlistId, trackId: dto.trackId, position } }),
      this.prisma.playlist.update({ where: { id: playlistId }, data: { trackCount: { increment: 1 } } }),
    ]);

    return { message: 'Morceau ajouté à la playlist' };
  }

  async removeTrack(userId: string, playlistId: string, trackId: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) throw new NotFoundException('Playlist non trouvée');
    if (playlist.userId !== userId) throw new ForbiddenException('Non autorisé');

    await this.prisma.$transaction([
      this.prisma.playlistTrack.delete({ where: { playlistId_trackId: { playlistId, trackId } } }),
      this.prisma.playlist.update({ where: { id: playlistId }, data: { trackCount: { decrement: 1 } } }),
    ]);

    return { message: 'Morceau retiré de la playlist' };
  }
}
