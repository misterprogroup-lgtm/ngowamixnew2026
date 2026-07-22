import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/modules/redis/redis.service';
import { CreateTrackDto, UpdateTrackDto } from './dto/create-track.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TrackVisibility, SubscriptionPlan } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const PREMIUM_PLANS: string[] = [
  SubscriptionPlan.PRO_MENSUEL,
  SubscriptionPlan.PRO_ANNUEL,
  SubscriptionPlan.FAMILLE_MENSUEL,
  SubscriptionPlan.FAMILLE_ANNUEL,
];

const FREE_LISTEN_LIMIT = 30;
const FREE_DOWNLOAD_LIMIT = 5;

@Injectable()
export class MusicService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async createTrack(artistUserId: string, dto: CreateTrackDto, audioFile: Express.Multer.File, coverFile?: Express.Multer.File) {
    const artistProfile = await this.prisma.artistProfile.findUnique({
      where: { userId: artistUserId },
    });

    if (!artistProfile) {
      throw new ForbiddenException('Profil artiste requis');
    }

    const slug = this.generateSlug(dto.title);
    const existingSlug = await this.prisma.track.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new BadRequestException('Un morceau avec ce titre existe déjà');
    }

    const track = await this.prisma.track.create({
      data: {
        artistId: artistProfile.id,
        title: dto.title,
        slug,
        description: dto.description,
        audioUrl: `/uploads/audio/${audioFile.filename}`,
        audioSize: audioFile.size,
        coverUrl: coverFile ? `/uploads/covers/${coverFile.filename}` : null,
        genre: dto.genre,
        tags: dto.tags || [],
        visibility: dto.visibility || TrackVisibility.PUBLIC,
        isExplicit: dto.isExplicit || false,
        publishedAt: dto.visibility !== TrackVisibility.PRIVATE ? new Date() : null,
      },
      include: {
        artist: {
          select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } },
        },
      },
    });

    // Invalidate cache
    await this.redis.flushPattern('tracks:*');
    await this.redis.flushPattern('trending:*');

    return track;
  }

  async findAll(pagination: PaginationDto, genre?: string, search?: string) {
    const { skip, limit } = pagination;
    const cacheKey = `tracks:list:${genre || 'all'}:${search || ''}:${pagination.page}:${pagination.limit}`;

    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const where: any = { visibility: TrackVisibility.PUBLIC };
    if (genre) where.genre = genre;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [tracks, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: {
            select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } },
          },
        },
      }),
      this.prisma.track.count({ where }),
    ]);

    const result = {
      data: tracks,
      meta: { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / (limit ?? 20)) },
    };

    await this.redis.setJson(cacheKey, result, 120); // cache 2min
    return result;
  }

  async findTrending(pagination: PaginationDto, genre?: string) {
    const { skip, limit } = pagination;
    const cacheKey = `trending:${genre || 'all'}:${pagination.page}:${pagination.limit}`;

    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const where: any = { visibility: TrackVisibility.PUBLIC };
    if (genre) where.genre = genre;

    const [tracks, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        skip,
        take: limit,
        orderBy: { playCount: 'desc' },
        include: {
          artist: {
            select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } },
          },
        },
      }),
      this.prisma.track.count({ where }),
    ]);

    const result = { data: tracks, meta: { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / (limit ?? 20)) } };
    await this.redis.setJson(cacheKey, result, 300); // cache 5min
    return result;
  }

  async getGenres() {
    const cacheKey = 'genres:all';
    const cached = await this.redis.getJson<string[]>(cacheKey);
    if (cached) return cached;

    const tracks = await this.prisma.track.findMany({
      where: { genre: { not: null }, visibility: TrackVisibility.PUBLIC },
      select: { genre: true },
      distinct: ['genre'],
    });
    const genres = tracks.map(t => t.genre).filter(Boolean);
    await this.redis.setJson(cacheKey, genres, 600); // cache 10min
    return genres;
  }

  async getRadio(genre: string, pagination: PaginationDto) {
    const { limit } = pagination;
    const where: any = { visibility: TrackVisibility.PUBLIC };
    if (genre && genre !== 'Tous') where.genre = genre;

    const total = await this.prisma.track.count({ where });
    const take = Math.min(limit ?? 50, total);

    const tracks = await this.prisma.track.findMany({
      where,
      take,
      orderBy: { playCount: 'desc' },
      include: {
        artist: {
          select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } },
        },
      },
    });

    for (let i = tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
    }

    return { data: tracks, total };
  }

  async getRecommended(userId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;

    const recentHistory = await this.prisma.listenHistory.findMany({
      where: { userId },
      orderBy: { listenedAt: 'desc' },
      take: 20,
      include: { track: { select: { genre: true } } },
    });

    const genres = [...new Set(recentHistory.map(h => h.track.genre).filter(Boolean))] as string[];

    const where: any = { visibility: TrackVisibility.PUBLIC };
    if (genres.length > 0) {
      where.genre = { in: genres };
      where.trackId = { notIn: recentHistory.map(h => h.trackId) };
    }

    const [tracks, total] = await Promise.all([
      this.prisma.track.findMany({
        where,
        skip,
        take: limit ?? 20,
        orderBy: { playCount: 'desc' },
        include: {
          artist: { select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } } },
        },
      }),
      this.prisma.track.count({ where }),
    ]);

    if (tracks.length < (limit ?? 20)) {
      const existingIds = tracks.map(t => t.id);
      const fallback = await this.prisma.track.findMany({
        where: { visibility: TrackVisibility.PUBLIC, id: { notIn: existingIds } },
        take: (limit ?? 20) - tracks.length,
        orderBy: { playCount: 'desc' },
        include: {
          artist: { select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } } },
        },
      });
      tracks.push(...fallback);
    }

    return { data: tracks, meta: { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / (limit ?? 20)) } };
  }

  async findBySlug(slug: string) {
    const cacheKey = `track:slug:${slug}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const track = await this.prisma.track.findUnique({
      where: { slug },
      include: {
        artist: {
          select: { id: true, artistName: true, slug: true, user: { select: { pseudo: true, avatarUrl: true } } },
        },
        albumTracks: { include: { album: { select: { title: true, slug: true, coverUrl: true } } } },
      },
    });

    if (!track) throw new NotFoundException('Morceau non trouvé');
    await this.redis.setJson(cacheKey, track, 300);
    return track;
  }

  async updateTrack(artistUserId: string, trackId: string, dto: UpdateTrackDto) {
    const track = await this.prisma.track.findUnique({ where: { id: trackId }, include: { artist: true } });
    if (!track) throw new NotFoundException('Morceau non trouvé');
    if (track.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    const updated = await this.prisma.track.update({
      where: { id: trackId },
      data: {
        ...(dto.title && { title: dto.title, slug: this.generateSlug(dto.title) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.genre && { genre: dto.genre }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.visibility && { visibility: dto.visibility }),
        ...(dto.isExplicit !== undefined && { isExplicit: dto.isExplicit }),
      },
    });

    await this.redis.del(`track:slug:${track.slug}`);
    await this.redis.flushPattern('tracks:*');
    await this.redis.flushPattern('trending:*');

    return updated;
  }

  async deleteTrack(artistUserId: string, trackId: string) {
    const track = await this.prisma.track.findUnique({ where: { id: trackId }, include: { artist: true } });
    if (!track) throw new NotFoundException('Morceau non trouvé');
    if (track.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    // Clean up files
    this.cleanupFiles(track.audioUrl, track.coverUrl ?? undefined);

    await this.prisma.track.delete({ where: { id: trackId } });

    await this.redis.del(`track:slug:${track.slug}`);
    await this.redis.flushPattern('tracks:*');
    await this.redis.flushPattern('trending:*');

    return { message: 'Morceau supprimé' };
  }

  async getMyTracks(artistUserId: string, pagination: PaginationDto) {
    const artistProfile = await this.prisma.artistProfile.findUnique({ where: { userId: artistUserId } });
    if (!artistProfile) throw new ForbiddenException('Profil artiste requis');

    const { skip, limit } = pagination;
    const [tracks, total] = await Promise.all([
      this.prisma.track.findMany({
        where: { artistId: artistProfile.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.track.count({ where: { artistId: artistProfile.id } }),
    ]);

    return {
      data: tracks,
      meta: { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / (limit ?? 20)) },
    };
  }

  async recordListen(userId: string, trackId: string, duration: number) {
    if (duration < 30) {
      return { counted: false, message: 'Écoute trop courte (minimum 30 secondes)' };
    }

    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track) throw new NotFoundException('Morceau non trouvé');

    // Check premium status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const isPremium = PREMIUM_PLANS.includes(user?.subscription?.plan as string);

    // Premium users have unlimited listens
    if (isPremium) {
      await this.prisma.$transaction([
        this.prisma.track.update({ where: { id: trackId }, data: { playCount: { increment: 1 } } }),
        this.prisma.listenHistory.create({ data: { userId, trackId, duration } }),
      ]);
      return { counted: true, remaining: -1, isPremium: true };
    }

    // Free user — check daily quota
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let quota = await this.prisma.dailyQuota.findUnique({ where: { userId } });

    if (!quota || quota.date < today) {
      quota = await this.prisma.dailyQuota.upsert({
        where: { userId },
        update: { listensUsed: 0, downloadsUsed: 0, date: new Date() },
        create: { userId, listensUsed: 0, downloadsUsed: 0, listenLimit: FREE_LISTEN_LIMIT, downloadLimit: FREE_DOWNLOAD_LIMIT },
      });
    }

    if (quota.listensUsed >= quota.listenLimit) {
      return {
        counted: false,
        quotaExceeded: true,
        message: 'Limite quotidienne atteinte (30 écoutes/jour). Passez au compte Pro !',
        remaining: 0,
      };
    }

    await this.prisma.$transaction([
      this.prisma.dailyQuota.update({
        where: { userId },
        data: { listensUsed: { increment: 1 } },
      }),
      this.prisma.track.update({
        where: { id: trackId },
        data: { playCount: { increment: 1 } },
      }),
      this.prisma.listenHistory.create({
        data: { userId, trackId, duration },
      }),
    ]);

    return { counted: true, remaining: quota.listenLimit - quota.listensUsed - 1, isPremium: false };
  }

  async recordDownload(userId: string, trackId: string) {
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track) throw new NotFoundException('Morceau non trouvé');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const isPremium = PREMIUM_PLANS.includes(user?.subscription?.plan as string);

    // Premium users have unlimited downloads
    if (isPremium) {
      await this.prisma.$transaction([
        this.prisma.track.update({ where: { id: trackId }, data: { downloadCount: { increment: 1 } } }),
        this.prisma.downloadHistory.create({ data: { userId, trackId } }),
      ]);
      return { allowed: true, remaining: -1, isPremium: true };
    }

    // Free user — check daily quota
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let quota = await this.prisma.dailyQuota.findUnique({ where: { userId } });

    if (!quota || quota.date < today) {
      quota = await this.prisma.dailyQuota.upsert({
        where: { userId },
        update: { listensUsed: 0, downloadsUsed: 0, date: new Date() },
        create: { userId, listensUsed: 0, downloadsUsed: 0, listenLimit: FREE_LISTEN_LIMIT, downloadLimit: FREE_DOWNLOAD_LIMIT },
      });
    }

    if (quota.downloadsUsed >= quota.downloadLimit) {
      return {
        allowed: false,
        quotaExceeded: true,
        message: 'Limite quotidienne atteinte (5 téléchargements/jour). Passez au compte Pro !',
        remaining: 0,
      };
    }

    await this.prisma.$transaction([
      this.prisma.dailyQuota.update({
        where: { userId },
        data: { downloadsUsed: { increment: 1 } },
      }),
      this.prisma.track.update({ where: { id: trackId }, data: { downloadCount: { increment: 1 } } }),
      this.prisma.downloadHistory.create({ data: { userId, trackId } }),
    ]);

    return { allowed: true, remaining: quota.downloadLimit - quota.downloadsUsed - 1, isPremium: false };
  }

  async search(query: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;
    const searchWhere = {
      visibility: TrackVisibility.PUBLIC,
      OR: [
        { title: { contains: query, mode: 'insensitive' as any } },
        { genre: { contains: query, mode: 'insensitive' as any } },
        { tags: { has: query } },
      ],
    };

    const [tracks, total] = await Promise.all([
      this.prisma.track.findMany({
        where: searchWhere,
        skip,
        take: limit,
        orderBy: { playCount: 'desc' },
        include: { artist: { select: { artistName: true, slug: true } } },
      }),
      this.prisma.track.count({ where: searchWhere }),
    ]);

    return { data: tracks, meta: { total, page: pagination.page, limit: pagination.limit } };
  }

  async getQuotaStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const isPremium = PREMIUM_PLANS.includes(user?.subscription?.plan as string);

    if (isPremium) {
      return {
        listensUsed: 0,
        listenLimit: -1,
        listensRemaining: -1,
        downloadsUsed: 0,
        downloadLimit: -1,
        downloadsRemaining: -1,
        isPremium: true,
        plan: user?.subscription?.plan,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let quota = await this.prisma.dailyQuota.findUnique({ where: { userId } });
    if (!quota || quota.date < today) {
      quota = await this.prisma.dailyQuota.upsert({
        where: { userId },
        update: { listensUsed: 0, downloadsUsed: 0, date: new Date() },
        create: { userId, listensUsed: 0, downloadsUsed: 0, listenLimit: FREE_LISTEN_LIMIT, downloadLimit: FREE_DOWNLOAD_LIMIT },
      });
    }

    return {
      listensUsed: quota.listensUsed,
      listenLimit: quota.listenLimit,
      listensRemaining: quota.listenLimit - quota.listensUsed,
      downloadsUsed: quota.downloadsUsed,
      downloadLimit: quota.downloadLimit,
      downloadsRemaining: quota.downloadLimit - quota.downloadsUsed,
      isPremium: false,
      plan: 'GRATUIT',
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString(36);
  }

  private cleanupFiles(audioUrl?: string, coverUrl?: string) {
    try {
      if (audioUrl) {
        const audioPath = path.join(process.cwd(), audioUrl);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      }
      if (coverUrl) {
        const coverPath = path.join(process.cwd(), coverUrl);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      }
    } catch (err) {
      console.error('File cleanup error:', err);
    }
  }

  async getListenHistory(userId: string, limit = 30) {
    return this.prisma.listenHistory.findMany({
      where: { userId },
      orderBy: { listenedAt: 'desc' },
      take: limit,
      include: {
        track: {
          select: { id: true, title: true, slug: true, coverUrl: true, genre: true, artist: { select: { artistName: true, slug: true } } },
        },
      },
    });
  }

  async getDownloadHistory(userId: string, limit = 30) {
    return this.prisma.downloadHistory.findMany({
      where: { userId },
      orderBy: { downloadedAt: 'desc' },
      take: limit,
      include: {
        track: {
          select: { id: true, title: true, slug: true, coverUrl: true, genre: true, artist: { select: { artistName: true, slug: true } } },
        },
      },
    });
  }
}
