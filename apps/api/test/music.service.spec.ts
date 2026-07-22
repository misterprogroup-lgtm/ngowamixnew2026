import { Test, TestingModule } from '@nestjs/testing';
import { MusicService } from '../src/modules/music/music.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/common/modules/redis/redis.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('MusicService', () => {
  let service: MusicService;
  let prismaMock: any;
  let redisMock: any;

  beforeEach(async () => {
    prismaMock = {
      artistProfile: { findUnique: jest.fn() },
      track: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      dailyQuota: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      listenHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      downloadHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    };

    redisMock = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      flushPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MusicService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<MusicService>(MusicService);
  });

  describe('recordListen', () => {
    it('should reject listens shorter than 30 seconds', async () => {
      const result = await service.recordListen('user1', 'track1', 15);
      expect(result.counted).toBe(false);
      expect(result.message).toContain('30 secondes');
    });

    it('should count listens of 30 seconds or more', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        subscription: { plan: 'GRATUIT' },
      });
      prismaMock.dailyQuota.findUnique.mockResolvedValue({
        userId: 'user1',
        listensUsed: 5,
        downloadsUsed: 0,
        listenLimit: 30,
        downloadLimit: 5,
        date: new Date(),
      });
      prismaMock.track.findUnique.mockResolvedValue({ id: 'track1' });

      const result = await service.recordListen('user1', 'track1', 45);
      expect(result.counted).toBe(true);
      expect(result.isPremium).toBe(false);
    });

    it('should allow unlimited listens for premium users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        subscription: { plan: 'PRO_MENSUEL' },
      });
      prismaMock.track.findUnique.mockResolvedValue({ id: 'track1' });

      const result = await service.recordListen('user1', 'track1', 45);
      expect(result.counted).toBe(true);
      expect(result.isPremium).toBe(true);
      expect(result.remaining).toBe(-1);
    });

    it('should block when quota exceeded for free users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        subscription: { plan: 'GRATUIT' },
      });
      prismaMock.dailyQuota.findUnique.mockResolvedValue({
        userId: 'user1',
        listensUsed: 30,
        downloadsUsed: 0,
        listenLimit: 30,
        downloadLimit: 5,
        date: new Date(),
      });
      prismaMock.track.findUnique.mockResolvedValue({ id: 'track1' });

      const result = await service.recordListen('user1', 'track1', 45);
      expect(result.counted).toBe(false);
      expect(result.quotaExceeded).toBe(true);
    });
  });

  describe('recordDownload', () => {
    it('should allow unlimited downloads for premium users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        subscription: { plan: 'PRO_ANNUEL' },
      });
      prismaMock.track.findUnique.mockResolvedValue({ id: 'track1' });

      const result = await service.recordDownload('user1', 'track1');
      expect(result.allowed).toBe(true);
      expect(result.isPremium).toBe(true);
    });

    it('should block when download quota exceeded for free users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        subscription: { plan: 'GRATUIT' },
      });
      prismaMock.dailyQuota.findUnique.mockResolvedValue({
        userId: 'user1',
        listensUsed: 10,
        downloadsUsed: 5,
        listenLimit: 30,
        downloadLimit: 5,
        date: new Date(),
      });
      prismaMock.track.findUnique.mockResolvedValue({ id: 'track1' });

      const result = await service.recordDownload('user1', 'track1');
      expect(result.allowed).toBe(false);
      expect(result.quotaExceeded).toBe(true);
    });
  });

  describe('getQuotaStatus', () => {
    it('should return premium status for Pro users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        subscription: { plan: 'PRO_MENSUEL' },
      });

      const result = await service.getQuotaStatus('user1');
      expect(result.isPremium).toBe(true);
      expect(result.listenLimit).toBe(-1);
      expect(result.downloadLimit).toBe(-1);
    });

    it('should return quota for free users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
        subscription: { plan: 'GRATUIT' },
      });
      prismaMock.dailyQuota.findUnique.mockResolvedValue({
        userId: 'user1',
        listensUsed: 12,
        downloadsUsed: 2,
        listenLimit: 30,
        downloadLimit: 5,
        date: new Date(),
      });

      const result = await service.getQuotaStatus('user1');
      expect(result.isPremium).toBe(false);
      expect(result.listensUsed).toBe(12);
      expect(result.listensRemaining).toBe(18);
      expect(result.downloadsRemaining).toBe(3);
    });
  });

  describe('getGenres', () => {
    it('should return cached genres if available', async () => {
      const cachedGenres = ['Afrobeat', 'Reggae', 'Hip-Hop'];
      redisMock.getJson.mockResolvedValue(cachedGenres);

      const result = await service.getGenres();
      expect(result).toEqual(cachedGenres);
      expect(redisMock.getJson).toHaveBeenCalledWith('genres:all');
    });

    it('should fetch from DB and cache if not cached', async () => {
      prismaMock.track.findMany.mockResolvedValue([
        { genre: 'Afrobeat' },
        { genre: 'Reggae' },
      ]);

      const result = await service.getGenres();
      expect(result).toEqual(['Afrobeat', 'Reggae']);
      expect(redisMock.setJson).toHaveBeenCalled();
    });
  });
});
