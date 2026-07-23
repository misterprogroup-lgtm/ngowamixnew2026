import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/modules/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QrService, QrTicketData } from '../qr/qr.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import * as crypto from 'crypto';

@Injectable()
export class ConcertsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationsService,
    private qrService: QrService,
  ) {}

  async create(artistUserId: string, dto: {
    title: string;
    description?: string;
    venue: string;
    city: string;
    country?: string;
    date: string;
    time?: string;
    ticketPrice: number;
    totalSeats: number;
  }, coverFile?: Express.Multer.File) {
    const artistProfile = await this.prisma.artistProfile.findUnique({ where: { userId: artistUserId } });
    if (!artistProfile) throw new ForbiddenException('Profil artiste requis');

    const slug = this.generateSlug(dto.title);

    const result = await this.prisma.concert.create({
      data: {
        artistId: artistProfile.id,
        title: dto.title,
        slug,
        description: dto.description,
        coverUrl: coverFile ? `/uploads/covers/${coverFile.filename}` : null,
        venue: dto.venue,
        city: dto.city,
        country: dto.country || 'Cameroun',
        date: new Date(dto.date),
        time: dto.time,
        ticketPrice: dto.ticketPrice || 0,
        totalSeats: dto.totalSeats || 0,
      },
      include: { artist: { select: { artistName: true, slug: true } } },
    });

    await this.redis.flushPattern('concerts:*');
    return result;
  }

  async findAll(pagination: PaginationDto, upcoming?: boolean) {
    const cacheKey = `concerts:list:${upcoming}:${pagination.page}:${pagination.limit}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const { skip, limit } = pagination;
    const where = upcoming ? { date: { gte: new Date() }, status: 'UPCOMING' } : {};

    const [concerts, total] = await Promise.all([
      this.prisma.concert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: {
          artist: { select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } } },
          _count: { select: { tickets: true } },
        },
      }),
      this.prisma.concert.count({ where }),
    ]);

    const result = { data: concerts, meta: { total, page: pagination.page, limit: pagination.limit } };
    await this.redis.setJson(cacheKey, result, 120);
    return result;
  }

  async findBySlug(slug: string) {
    const cacheKey = `concert:slug:${slug}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const concert = await this.prisma.concert.findUnique({
      where: { slug },
      include: {
        artist: { select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } } },
        _count: { select: { tickets: true } },
      },
    });
    if (!concert) throw new NotFoundException('Concert non trouvé');
    await this.redis.setJson(cacheKey, concert, 120);
    return concert;
  }

  async purchaseTicket(userId: string, concertId: string, quantity: number = 1) {
    const concert = await this.prisma.concert.findUnique({ where: { id: concertId } });
    if (!concert) throw new NotFoundException('Concert non trouvé');
    if (concert.status !== 'UPCOMING') throw new BadRequestException('Ce concert n\'est plus disponible');

    const availableSeats = concert.totalSeats - concert.soldSeats;
    if (quantity > availableSeats) throw new BadRequestException(`Il ne reste que ${availableSeats} place(s)`);

    const totalPaid = concert.ticketPrice * quantity;
    const qrCode = crypto.randomBytes(16).toString('hex');

    const ticket = await this.prisma.ticket.create({
      data: {
        userId,
        concertId,
        quantity,
        totalPaid,
        qrCode,
      },
      include: { concert: { select: { title: true, venue: true, city: true, date: true, time: true } } },
    });

    await this.prisma.concert.update({
      where: { id: concertId },
      data: { soldSeats: { increment: quantity } },
    });

    // Generate real QR code
    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true } });

    const qrTicketData: QrTicketData = {
      ticketId: ticket.id,
      concertId: concert.id,
      concertTitle: concert.title,
      venue: concert.venue,
      city: concert.city,
      date: concert.date.toISOString(),
      time: concert.time || undefined,
      quantity,
      buyerPseudo: buyer?.pseudo || 'Unknown',
      qrCode,
    };

    const qrDataUrl = await this.qrService.generateTicketQr(qrTicketData);

    // Notify artist
    const concertWithArtist = await this.prisma.concert.findUnique({ where: { id: concertId }, include: { artist: { select: { userId: true } } } });
    if (concertWithArtist) {
      await this.notifications.create(concertWithArtist.artist.userId, {
        type: 'purchase',
        title: 'Nouvelle vente de ticket',
        message: `${buyer?.pseudo} a acheté ${quantity} ticket(s) pour "${concert.title}"`,
        linkUrl: `/concerts/${concert.slug}`,
      });
    }

    return {
      ...ticket,
      qrImage: qrDataUrl,
    };
  }

  async getMyTickets(userId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        concert: {
          include: { artist: { select: { artistName: true, slug: true } } },
        },
        user: { select: { pseudo: true } },
      },
    });

    // Attach a QR code image (data URL) to each ticket
    return Promise.all(
      tickets.map(async (ticket) => {
        const qrImage = ticket.qrCode
          ? await this.qrService.generateTicketQr({
              ticketId: ticket.id,
              concertId: ticket.concertId,
              concertTitle: ticket.concert.title,
              venue: ticket.concert.venue,
              city: ticket.concert.city,
              date: ticket.concert.date.toISOString(),
              time: ticket.concert.time || undefined,
              quantity: ticket.quantity,
              buyerPseudo: ticket.user.pseudo,
              qrCode: ticket.qrCode,
            })
          : null;

        const { user, ...ticketData } = ticket;
        return { ...ticketData, qrImage };
      }),
    );
  }

  async checkIn(artistUserId: string, concertId: string, qrCode: string) {
    const concert = await this.prisma.concert.findUnique({
      where: { id: concertId },
      include: { artist: { select: { userId: true } } },
    });
    if (!concert) throw new NotFoundException('Concert non trouvé');
    if (concert.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    const ticket = await this.prisma.ticket.findUnique({ where: { qrCode } });
    if (!ticket) throw new NotFoundException('QR code invalide');
    if (ticket.concertId !== concertId) throw new BadRequestException('Ce ticket n\'est pas pour ce concert');
    if (ticket.status === 'USED') throw new BadRequestException('Ce ticket a déjà été utilisé');
    if (ticket.status === 'CANCELLED') throw new BadRequestException('Ce ticket a été annulé');

    await this.prisma.ticket.update({ where: { id: ticket.id }, data: { status: 'USED' } });

    const user = await this.prisma.user.findUnique({ where: { id: ticket.userId }, select: { pseudo: true } });

    return {
      message: 'Entrée validée',
      ticket: { id: ticket.id, quantity: ticket.quantity, totalPaid: ticket.totalPaid },
      user: { pseudo: user?.pseudo },
    };
  }

  async getMyConcerts(artistUserId: string) {
    const artistProfile = await this.prisma.artistProfile.findUnique({ where: { userId: artistUserId } });
    if (!artistProfile) throw new ForbiddenException('Profil artiste requis');

    return this.prisma.concert.findMany({
      where: { artistId: artistProfile.id },
      orderBy: { date: 'desc' },
      include: { _count: { select: { tickets: true } } },
    });
  }

  async getAttendees(artistUserId: string, concertId: string) {
    const concert = await this.prisma.concert.findUnique({
      where: { id: concertId },
      include: { artist: { select: { userId: true, artistName: true } } },
    });
    if (!concert) throw new NotFoundException('Concert non trouvé');
    if (concert.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    const tickets = await this.prisma.ticket.findMany({
      where: { concertId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, pseudo: true, avatarUrl: true, email: true } },
      },
    });

    return tickets;
  }

  async update(artistUserId: string, concertId: string, dto: Record<string, any>) {
    const concert = await this.prisma.concert.findUnique({ where: { id: concertId }, include: { artist: true } });
    if (!concert) throw new NotFoundException('Concert non trouvé');
    if (concert.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');

    const updated = await this.prisma.concert.update({
      where: { id: concertId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.venue && { venue: dto.venue }),
        ...(dto.city && { city: dto.city }),
        ...(dto.country && { country: dto.country }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.time && { time: dto.time }),
        ...(dto.ticketPrice !== undefined && { ticketPrice: dto.ticketPrice }),
        ...(dto.totalSeats !== undefined && { totalSeats: dto.totalSeats }),
        ...(dto.status && { status: dto.status }),
      },
    });

    await this.redis.del(`concert:slug:${concert.slug}`);
    await this.redis.flushPattern('concerts:*');
    return updated;
  }

  async delete(artistUserId: string, concertId: string) {
    const concert = await this.prisma.concert.findUnique({ where: { id: concertId }, include: { artist: true } });
    if (!concert) throw new NotFoundException('Concert non trouvé');
    if (concert.artist.userId !== artistUserId) throw new ForbiddenException('Non autorisé');
    await this.prisma.concert.delete({ where: { id: concertId } });
    await this.redis.del(`concert:slug:${concert.slug}`);
    await this.redis.flushPattern('concerts:*');
    return { message: 'Concert supprimé' };
  }

  private generateSlug(title: string): string {
    return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString(36);
  }
}
