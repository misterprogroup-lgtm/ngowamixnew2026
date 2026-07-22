import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService, EarningsBreakdown } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private notifications: NotificationsService,
  ) {}

  async initiatePayment(userId: string, dto: {
    amount: number;
    method: string;
    targetType: string;
    targetId: string;
  }) {
    const allowedMethods = ['orange_money', 'mtn_money', 'carte_bancaire'];
    if (!allowedMethods.includes(dto.method)) {
      throw new BadRequestException('Méthode de paiement invalide');
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('Montant invalide');
    }

    const reference = 'NGW-' + crypto.randomBytes(8).toString('hex').toUpperCase();

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        method: dto.method,
        status: 'COMPLETED',
        targetType: dto.targetType,
        targetId: dto.targetId,
        reference,
      },
    });

    return payment;
  }

  async processConcertTicketPayment(userId: string, concertId: string, quantity: number, method: string) {
    const concert = await this.prisma.concert.findUnique({ where: { id: concertId }, include: { artist: true } });
    if (!concert) throw new NotFoundException('Concert non trouvé');
    if (concert.status !== 'UPCOMING') throw new BadRequestException('Ce concert n\'est plus disponible');

    const availableSeats = concert.totalSeats - concert.soldSeats;
    if (quantity > availableSeats) throw new BadRequestException(`Il ne reste que ${availableSeats} place(s)`);

    const totalPaid = concert.ticketPrice * quantity;
    if (totalPaid === 0) throw new BadRequestException('Ce concert est gratuit');

    const payment = await this.initiatePayment(userId, {
      amount: totalPaid,
      method,
      targetType: 'concert_ticket',
      targetId: concertId,
    });

    const qrCode = crypto.randomBytes(16).toString('hex');

    const ticket = await this.prisma.ticket.create({
      data: {
        userId, concertId, quantity, totalPaid, qrCode,
      },
      include: { concert: { select: { title: true, venue: true, city: true, date: true, time: true } } },
    });

    await this.prisma.concert.update({
      where: { id: concertId },
      data: { soldSeats: { increment: quantity } },
    });

    // Créditer le wallet de l'artiste (net après commission + frais)
    const earnings = await this.wallet.creditArtistEarnings(concert.artist.userId, totalPaid, method);

    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true } });
    await this.notifications.create(concert.artist.userId, {
      type: 'purchase',
      title: 'Nouvelle vente de ticket',
      message: `${buyer?.pseudo} a acheté ${quantity} ticket(s) pour "${concert.title}" (+${earnings.net} FCFA net)`,
      linkUrl: `/concerts/${concert.slug}`,
    });

    return { payment, ticket, earnings };
  }

  async processLiveAccessPayment(userId: string, liveId: string, method: string) {
    const live = await this.prisma.paidLive.findUnique({ where: { id: liveId }, include: { artist: true } });
    if (!live) throw new NotFoundException('Live non trouvé');
    if (live.price === 0) throw new BadRequestException('Ce live est gratuit, accès automatique');

    const existing = await this.prisma.paidLiveAccess.findUnique({ where: { userId_liveId: { userId, liveId } } });
    if (existing) throw new BadRequestException('Vous avez déjà accès à ce live');

    const payment = await this.initiatePayment(userId, {
      amount: live.price,
      method,
      targetType: 'live_access',
      targetId: liveId,
    });

    const access = await this.prisma.paidLiveAccess.create({
      data: { userId, liveId, amount: live.price },
    });

    // Créditer le wallet de l'artiste
    const earnings = await this.wallet.creditArtistEarnings(live.artist.userId, live.price, method);

    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true } });
    await this.notifications.create(live.artist.userId, {
      type: 'purchase',
      title: 'Nouvelle vente de live',
      message: `${buyer?.pseudo} a acheté l'accès au live "${live.title}" (+${earnings.net} FCFA net)`,
      linkUrl: `/lives/${live.slug}`,
    });

    return { payment, access, earnings };
  }

  async processAlbumPayment(userId: string, albumId: string, method: string) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId }, include: { artist: true } });
    if (!album) throw new NotFoundException('Album non trouvé');
    if (album.isFree || album.price === 0) throw new BadRequestException('Cet album est gratuit');

    const existing = await this.prisma.albumPurchase.findUnique({ where: { userId_albumId: { userId, albumId } } });
    if (existing) throw new BadRequestException('Vous avez déjà acheté cet album');

    const payment = await this.initiatePayment(userId, {
      amount: album.price,
      method,
      targetType: 'album',
      targetId: albumId,
    });

    const purchase = await this.prisma.albumPurchase.create({
      data: { userId, albumId, amount: album.price },
    });

    // Créditer le wallet de l'artiste
    const earnings = await this.wallet.creditArtistEarnings(album.artist.userId, album.price, method);

    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true } });
    await this.notifications.create(album.artist.userId, {
      type: 'purchase',
      title: 'Album acheté',
      message: `${buyer?.pseudo} a acheté l'album "${album.title}" (+${earnings.net} FCFA net)`,
      linkUrl: `/albums/${album.slug}`,
    });

    return { payment, purchase, earnings };
  }

  async getUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
