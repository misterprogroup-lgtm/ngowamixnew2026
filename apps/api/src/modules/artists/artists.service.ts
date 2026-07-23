import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/modules/redis/redis.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ArtistsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(pagination: PaginationDto, search?: string) {
    const cacheKey = `artists:list:${search || ''}:${pagination.page}:${pagination.limit}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const { skip, limit } = pagination;
    const where = search ? {
      artistName: { contains: search, mode: 'insensitive' as any },
    } : {};

    const [artists, total] = await Promise.all([
      this.prisma.artistProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { followerCount: 'desc' },
        select: {
          id: true,
          userId: true,
          slug: true,
          artistName: true,
          bio: true,
          bannerUrl: true,
          genres: true,
          followerCount: true,
          user: {
            select: {
              id: true,
              pseudo: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.artistProfile.count(),
    ]);

    const result = {
      data: artists,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / (limit ?? 20)),
      },
    };

    await this.redis.setJson(cacheKey, result, 300);
    return result;
  }

  async findBySlug(slug: string) {
    const cacheKey = `artist:slug:${slug}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const artist = await this.prisma.artistProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        userId: true,
        slug: true,
        artistName: true,
        bio: true,
        bannerUrl: true,
        genres: true,
        socialLinks: true,
        followerCount: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true,
            country: true,
            city: true,
          },
        },
        tracks: {
          where: { visibility: 'PUBLIC' as any },
          orderBy: { playCount: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            slug: true,
            audioUrl: true,
            coverUrl: true,
            genre: true,
            tags: true,
            playCount: true,
            downloadCount: true,
            likeCount: true,
            audioDuration: true,
            createdAt: true,
          },
        },
        albums: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            releaseDate: true,
            _count: { select: { albumTracks: true } },
          },
        },
      },
    });

    if (!artist) {
      throw new NotFoundException('Artiste non trouvé');
    }

    const result = {
      ...artist,
      tracks: artist.tracks.map(t => ({ ...t, artist: { artistName: artist.artistName, slug: artist.slug } })),
      albums: artist.albums.map(a => ({ ...a, trackCount: a._count.albumTracks, artist: { artistName: artist.artistName, slug: artist.slug } })),
    };

    await this.redis.setJson(cacheKey, result, 300);
    return result;
  }

  async updateProfile(userId: string, dto: any) {
    const artistProfile = await this.prisma.artistProfile.findUnique({
      where: { userId },
    });

    if (!artistProfile) {
      throw new NotFoundException('Profil artiste non trouvé');
    }

    if (dto.artistName && dto.artistName !== artistProfile.artistName) {
      const slug = this.generateSlug(dto.artistName);
      const existingSlug = await this.prisma.artistProfile.findFirst({
        where: { slug, id: { not: artistProfile.id } },
      });

      if (existingSlug) {
        throw new ConflictException('Ce nom d\'artiste est déjà utilisé');
      }
    }

    const updatedProfile = await this.prisma.artistProfile.update({
      where: { userId },
      data: {
        ...(dto.artistName && { artistName: dto.artistName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.genres && { genres: dto.genres }),
        ...(dto.socialLinks && { socialLinks: dto.socialLinks }),
        ...(dto.bannerUrl && { bannerUrl: dto.bannerUrl }),
        ...(dto.artistName && { slug: this.generateSlug(dto.artistName) }),
      },
      select: {
        id: true,
        slug: true,
        artistName: true,
        bio: true,
        bannerUrl: true,
        genres: true,
        socialLinks: true,
        followerCount: true,
      },
    });

    await this.redis.flushPattern('artist:*');
    await this.redis.flushPattern('artists:*');
    return updatedProfile;
  }

  async getMyProfile(userId: string) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        slug: true,
        artistName: true,
        bio: true,
        bannerUrl: true,
        genres: true,
        socialLinks: true,
        followerCount: true,
        createdAt: true,
      },
    });

    if (!artist) {
      throw new NotFoundException('Profil artiste non trouvé');
    }

    return artist;
  }

  async getMyStats(userId: string) {
    const artistProfile = await this.prisma.artistProfile.findUnique({ where: { userId } });
    if (!artistProfile) throw new NotFoundException('Profil artiste non trouvé');

    const [totalTracks, totalAlbums, totalPlays, totalLikes, totalFollowers, recentListeners] = await Promise.all([
      this.prisma.track.count({ where: { artistId: artistProfile.id } }),
      this.prisma.album.count({ where: { artistId: artistProfile.id } }),
      this.prisma.track.aggregate({ where: { artistId: artistProfile.id }, _sum: { playCount: true } }),
      this.prisma.trackLike.count({ where: { track: { artistId: artistProfile.id } } }),
      this.prisma.follow.count({ where: { artistId: artistProfile.id } }),
      this.prisma.listenHistory.findMany({
        where: { track: { artistId: artistProfile.id } },
        orderBy: { listenedAt: 'desc' },
        take: 10,
        distinct: ['userId'],
        select: { userId: true, user: { select: { pseudo: true, avatarUrl: true, country: true, city: true } } },
      }),
    ]);

    const topTracks = await this.prisma.track.findMany({
      where: { artistId: artistProfile.id },
      orderBy: { playCount: 'desc' },
      take: 5,
      select: { id: true, title: true, playCount: true, likeCount: true, genre: true },
    });

    return {
      totalTracks,
      totalAlbums,
      totalPlays: totalPlays._sum.playCount ?? 0,
      totalLikes,
      totalFollowers,
      topTracks,
      recentListeners,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
