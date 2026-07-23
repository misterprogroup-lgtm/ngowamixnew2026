import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../../common/modules/cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PaidLivesService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private notifications: NotificationsService,
  ) {}

  async create(artistUserId: string, dto: {
    title: string;
    description?: string;
    price: number;
    scheduledAt?: string;
  }, coverFile?: Express.Multer.File) {
    const artistProfile = await this.prisma.artistProfile.findUnique({ where: { userId: artistUserId } });
    if (!artistProfile) throw new ForbiddenException('Profil artiste requis');

    const slug = this.generateSlug(dto.title);

    const coverUrl = coverFile
      ? await this.cloudinary.uploadBuffer(coverFile.buffer, 'covers', coverFile.originalname)
      : null;

    return this.prisma.paidLive.create({
      data: {
        artistId: artistProfile.id,
        title: dto.title,
        slug,
        description: dto.description,
        coverUrl,
        price: dto.price || 0,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
      include: { artist: { select: { artistName: true, slug: true } } },
    });
  }

  async findAll(pagination: PaginationDto) {
    const { skip, limit } = pagination;
    const [lives, total] = await Promise.all([
      this.prisma.paidLive.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: { select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } } },
          _count: { select: { accesses: true } },
        },
      }),
      this.prisma.paidLive.count(),
    ]);

    return { data: lives, meta: { total, page: pagination.page, limit: pagination.limit } };
  }

  async findBySlug(slug: string) {
    const live = await this.prisma.paidLive.findUnique({
      where: { slug },
      include: {
        artist: { select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } } },
        _count: { select: { accesses: true } },
      },
    });
    if (!live) throw new NotFoundException('Live non trouvé');
    return live;
  }

  async purchaseAccess(userId: string, liveId: string) {
    const live = await this.prisma.paidLive.findUnique({ where: { id: liveId } });
    if (!live) throw new NotFoundException('Live non trouvé');
    if (live.price === 0) throw new BadRequestException('Ce live est gratuit, accès automatique');

    const existing = await this.prisma.paidLiveAccess.findUnique({ where: { userId_liveId: { userId, liveId } } });
    if (existing) throw new BadRequestException('Vous avez déjà accès à ce live');

    const access = await this.prisma.paidLiveAccess.create({
      data: { userId, liveId, amount: live.price },
    });

    const liveWithArtist = await this.prisma.paidLive.findUnique({ where: { id: liveId }, include: { artist: { select: { userId: true } } } });
    if (liveWithArtist) {
      const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true } });
      await this.notifications.create(liveWithArtist.artist.userId, {
        type: 'purchase',
        title: 'Nouvelle vente de live',
        message: `${buyer?.pseudo} a acheté l'accès au live "${live.title}"`,
        linkUrl: `/lives/${live.slug}`,
      });
    }

    return access;
  }

  async checkAccess(userId: string, liveId: string): Promise<boolean> {
    const access = await this.prisma.paidLiveAccess.findUnique({ where: { userId_liveId: { userId, liveId } } });
    return !!access;
  }

  async toggleLive(artistUserId: string, liveId: string, isLive: boolean) {
    const live = await this.prisma.paidLive.findUnique({ where: { id: liveId }, include: { artist: true } });
    if (!live) throw new NotFoundException('Live non trouvé');
    if (live.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    return this.prisma.paidLive.update({ where: { id: liveId }, data: { isLive } });
  }

  async getMyLives(artistUserId: string) {
    const artistProfile = await this.prisma.artistProfile.findUnique({ where: { userId: artistUserId } });
    if (!artistProfile) throw new ForbiddenException('Profil artiste requis');

    return this.prisma.paidLive.findMany({
      where: { artistId: artistProfile.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { accesses: true } } },
    });
  }

  async delete(artistUserId: string, liveId: string) {
    const live = await this.prisma.paidLive.findUnique({ where: { id: liveId }, include: { artist: true } });
    if (!live) throw new NotFoundException('Live non trouvé');
    if (live.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');
    await this.prisma.paidLive.delete({ where: { id: liveId } });
    return { message: 'Live supprimé' };
  }

  private generateSlug(title: string): string {
    return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString(36);
  }
}
