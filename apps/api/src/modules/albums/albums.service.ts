import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/modules/redis/redis.service';
import { CloudinaryService } from '../../common/modules/cloudinary/cloudinary.service';
import { CreateAlbumDto, UpdateAlbumDto, AddTrackToAlbumDto } from './dto/album.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AlbumsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private cloudinary: CloudinaryService,
  ) {}

  async create(artistUserId: string, dto: CreateAlbumDto, coverFile?: Express.Multer.File) {
    const artistProfile = await this.prisma.artistProfile.findUnique({ where: { userId: artistUserId } });
    if (!artistProfile) throw new ForbiddenException('Profil artiste requis');

    const slug = this.generateSlug(dto.title);
    const existing = await this.prisma.album.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Un album avec ce titre existe déjà');

    const price = dto.price ?? 0;
    const isFree = dto.isFree ?? price === 0;

    const coverUrl = coverFile
      ? await this.cloudinary.uploadBuffer(coverFile.buffer, 'covers', coverFile.originalname)
      : null;

    return this.prisma.album.create({
      data: {
        artistId: artistProfile.id,
        title: dto.title,
        slug,
        description: dto.description,
        coverUrl,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
        price,
        isFree,
      },
      include: {
        artist: { select: { artistName: true, slug: true } },
      },
    });
  }

  async findAll(pagination: PaginationDto) {
    const cacheKey = `albums:list:${pagination.page}:${pagination.limit}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const { skip, limit } = pagination;
    const [albums, total] = await Promise.all([
      this.prisma.album.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: { select: { artistName: true, slug: true } },
          albumTracks: { include: { track: { select: { id: true, title: true, audioUrl: true, coverUrl: true, audioDuration: true } } }, orderBy: { position: 'asc' } },
          _count: { select: { albumTracks: true, albumPurchases: true } },
        },
      }),
      this.prisma.album.count(),
    ]);

    const result = { data: albums, meta: { total, page: pagination.page, limit: pagination.limit } };
    await this.redis.setJson(cacheKey, result, 300);
    return result;
  }

  async findBySlug(slug: string) {
    const cacheKey = `album:slug:${slug}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const album = await this.prisma.album.findUnique({
      where: { slug },
      include: {
        artist: { select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } } },
        albumTracks: { include: { track: true }, orderBy: { position: 'asc' } },
        _count: { select: { albumTracks: true, albumPurchases: true } },
      },
    });
    if (!album) throw new NotFoundException('Album non trouvé');
    await this.redis.setJson(cacheKey, album, 300);
    return album;
  }

  async update(artistUserId: string, albumId: string, dto: UpdateAlbumDto, coverFile?: Express.Multer.File) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId }, include: { artist: true } });
    if (!album) throw new NotFoundException('Album non trouvé');
    if (album.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    let coverUrl = dto.coverUrl;
    if (coverFile) {
      const uploadResult = await this.cloudinary.uploadBuffer(coverFile.buffer, {
        folder: 'ngowamix/covers',
        resource_type: 'image',
      });
      coverUrl = uploadResult.url;
    }

    const updated = await this.prisma.album.update({
      where: { id: albumId },
      data: {
        ...(dto.title && { title: dto.title, slug: this.generateSlug(dto.title) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(coverUrl && { coverUrl }),
        ...(dto.releaseDate && { releaseDate: new Date(dto.releaseDate) }),
        ...(dto.price !== undefined && { price: dto.price, isFree: dto.price === 0 }),
        ...(dto.isFree !== undefined && { isFree: dto.isFree, price: dto.isFree ? 0 : dto.price ?? album.price }),
      },
    });

    await this.redis.del(`album:slug:${album.slug}`);
    await this.redis.flushPattern('albums:*');
    return updated;
  }

  async delete(artistUserId: string, albumId: string) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId }, include: { artist: true } });
    if (!album) throw new NotFoundException('Album non trouvé');
    if (album.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    if (album.coverUrl) {
      this.cleanupFile(album.coverUrl);
    }

    await this.prisma.album.delete({ where: { id: albumId } });
    await this.redis.del(`album:slug:${album.slug}`);
    await this.redis.flushPattern('albums:*');
    return { message: 'Album supprimé' };
  }

  async addTrack(artistUserId: string, albumId: string, dto: AddTrackToAlbumDto) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId }, include: { artist: true } });
    if (!album) throw new NotFoundException('Album non trouvé');
    if (album.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    const track = await this.prisma.track.findUnique({ where: { id: dto.trackId } });
    if (!track || track.artistId !== album.artistId) throw new NotFoundException('Morceau non trouvé ou ne vous appartient pas');

    const existing = await this.prisma.albumTrack.findUnique({ where: { albumId_trackId: { albumId, trackId: dto.trackId } } });
    if (existing) throw new BadRequestException('Ce morceau est déjà dans l\'album');

    const maxPos = await this.prisma.albumTrack.aggregate({ where: { albumId }, _max: { position: true } });
    const position = dto.position ?? (maxPos._max.position ?? -1) + 1;

    return this.prisma.albumTrack.create({
      data: { albumId, trackId: dto.trackId, position },
      include: { track: { select: { id: true, title: true, audioUrl: true, coverUrl: true } } },
    });
  }

  async removeTrack(artistUserId: string, albumId: string, trackId: string) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId }, include: { artist: true } });
    if (!album) throw new NotFoundException('Album non trouvé');
    if (album.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    await this.prisma.albumTrack.delete({ where: { albumId_trackId: { albumId, trackId } } });
    return { message: 'Morceau retiré de l\'album' };
  }

  async getMyAlbums(artistUserId: string, pagination: PaginationDto) {
    const artistProfile = await this.prisma.artistProfile.findUnique({ where: { userId: artistUserId } });
    if (!artistProfile) throw new ForbiddenException('Profil artiste requis');

    const { skip, limit } = pagination;
    const [albums, total] = await Promise.all([
      this.prisma.album.findMany({
        where: { artistId: artistProfile.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          albumTracks: { include: { track: { select: { id: true, title: true } } } },
          _count: { select: { albumTracks: true, albumPurchases: true } },
        },
      }),
      this.prisma.album.count({ where: { artistId: artistProfile.id } }),
    ]);

    return { data: albums, meta: { total, page: pagination.page, limit: pagination.limit } };
  }

  async purchaseAlbum(userId: string, albumId: string) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId } });
    if (!album) throw new NotFoundException('Album non trouvé');
    if (album.isFree) throw new BadRequestException('Cet album est gratuit, pas besoin de l\'acheter');

    const existing = await this.prisma.albumPurchase.findUnique({ where: { userId_albumId: { userId, albumId } } });
    if (existing) throw new BadRequestException('Vous avez déjà acheté cet album');

    return this.prisma.albumPurchase.create({
      data: { userId, albumId, amount: album.price },
    });
  }

  async checkAlbumPurchased(userId: string, albumId: string): Promise<boolean> {
    const purchase = await this.prisma.albumPurchase.findUnique({ where: { userId_albumId: { userId, albumId } } });
    return !!purchase;
  }

  async getMyPurchases(userId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;
    const [purchases, total] = await Promise.all([
      this.prisma.albumPurchase.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          album: {
            include: {
              artist: { select: { artistName: true, slug: true } },
              albumTracks: { include: { track: { select: { id: true, title: true, audioUrl: true, coverUrl: true } } }, orderBy: { position: 'asc' } },
            },
          },
        },
      }),
      this.prisma.albumPurchase.count({ where: { userId } }),
    ]);

    return { data: purchases, meta: { total, page: pagination.page, limit: pagination.limit } };
  }

  async findTopAlbums(pagination: PaginationDto) {
    const cacheKey = `albums:top:${pagination.page}:${pagination.limit}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const { skip, limit } = pagination;
    const [albums, total] = await Promise.all([
      this.prisma.album.findMany({
        skip,
        take: limit,
        orderBy: { albumPurchases: { _count: 'desc' } },
        include: {
          artist: { select: { artistName: true, slug: true } },
          _count: { select: { albumTracks: true, albumPurchases: true } },
        },
      }),
      this.prisma.album.count(),
    ]);
    const result = { data: albums, meta: { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / (limit ?? 20)) } };
    await this.redis.setJson(cacheKey, result, 300);
    return result;
  }

  async getAlbumStats(artistUserId: string) {
    const artistProfile = await this.prisma.artistProfile.findUnique({ where: { userId: artistUserId } });
    if (!artistProfile) throw new ForbiddenException('Profil artiste requis');

    const albums = await this.prisma.album.findMany({ where: { artistId: artistProfile.id }, select: { id: true } });
    const albumIds = albums.map(a => a.id);

    const [totalAlbums, totalPurchases, totalRevenue] = await Promise.all([
      this.prisma.album.count({ where: { artistId: artistProfile.id } }),
      this.prisma.albumPurchase.count({ where: { albumId: { in: albumIds } } }),
      this.prisma.albumPurchase.aggregate({ where: { albumId: { in: albumIds } }, _sum: { amount: true } }),
    ]);

    return { totalAlbums, totalPurchases, totalRevenue: totalRevenue._sum.amount ?? 0 };
  }

  private cleanupFile(fileUrl: string) {
    try {
      const filePath = path.join(process.cwd(), fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('File cleanup error:', err);
    }
  }

  private generateSlug(title: string): string {
    return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString(36);
  }
}
