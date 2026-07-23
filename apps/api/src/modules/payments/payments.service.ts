import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService, EarningsBreakdown } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PawapayService } from './pawapay.service';
import * as crypto from 'crypto';

const PAWAPAY_METHODS = ['orange_money', 'mtn_money', 'moov_money', 'wave'];

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private notifications: NotificationsService,
    private pawapay: PawapayService,
  ) {}

  /**
   * Initie un paiement. Si PawaPay est configuré et un téléphone est fourni,
   * le paiement est PENDING en attendant la confirmation USSD/webhook.
   * Sinon, fallback sur la validation immédiate (mode démo).
   */
  async initiatePayment(userId: string, dto: {
    amount: number;
    method: string;
    targetType: string;
    targetId: string;
    quantity?: number;
    phone?: string;
  }) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Montant invalide');
    }

    const reference = 'NGW-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    const usePawapay = this.pawapay.isConfigured && dto.phone && PAWAPAY_METHODS.includes(dto.method);

    if (usePawapay) {
      const deposit = await this.pawapay.initiateDeposit({
        amount: dto.amount,
        method: dto.method,
        phone: dto.phone!,
        statementDescription: `Ngowamix ${dto.targetType}`,
      });

      const payment = await this.prisma.payment.create({
        data: {
          userId,
          amount: dto.amount,
          quantity: dto.quantity || 1,
          method: dto.method,
          status: 'PENDING',
          targetType: dto.targetType,
          targetId: dto.targetId,
          reference: deposit.depositId,
        },
      });

      return { payment, provider: 'pawapay', depositId: deposit.depositId, status: deposit.status };
    }

    // Fallback démo : validation immédiate
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        quantity: dto.quantity || 1,
        method: dto.method,
        status: 'COMPLETED',
        targetType: dto.targetType,
        targetId: dto.targetId,
        reference,
      },
    });

    return { payment, provider: 'demo', status: 'COMPLETED' };
  }

  async processConcertTicketPayment(userId: string, concertId: string, quantity: number, method: string, phone?: string) {
    const concert = await this.prisma.concert.findUnique({ where: { id: concertId }, include: { artist: true } });
    if (!concert) throw new NotFoundException('Concert non trouvé');
    if (concert.status !== 'UPCOMING') throw new BadRequestException('Ce concert n\'est plus disponible');

    const availableSeats = concert.totalSeats - concert.soldSeats;
    if (quantity > availableSeats) throw new BadRequestException(`Il ne reste que ${availableSeats} place(s)`);

    const totalPaid = concert.ticketPrice * quantity;
    if (totalPaid === 0) throw new BadRequestException('Ce concert est gratuit');

    const result = await this.initiatePayment(userId, {
      amount: totalPaid,
      method,
      targetType: 'concert_ticket',
      targetId: concertId,
      quantity,
      phone,
    });

    // Paiement PENDING (PawaPay) : le ticket sera créé au webhook
    if (result.status !== 'COMPLETED') {
      return {
        ...result,
        message: 'Confirmez le paiement sur votre téléphone (USSD)',
      };
    }

    return this.finalizeConcertTicket(result.payment.id, userId, concertId, quantity);
  }

  private async finalizeConcertTicket(paymentId: string, userId: string, concertId: string, quantity: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const concert = await tx.concert.findUnique({ where: { id: concertId }, include: { artist: true } });
      if (!concert) throw new NotFoundException('Concert non trouvé');

      const totalPaid = concert.ticketPrice * quantity;
      const qrCode = crypto.randomBytes(16).toString('hex');

      const ticket = await tx.ticket.create({
        data: { userId, concertId, quantity, totalPaid, qrCode },
        include: { concert: { select: { title: true, venue: true, city: true, date: true, time: true } } },
      });

      await tx.concert.update({
        where: { id: concertId },
        data: { soldSeats: { increment: quantity } },
      });

      return { concert, totalPaid, ticket };
    });

    const earnings = await this.wallet.creditArtistEarnings(result.concert.artist.userId, result.totalPaid, 'mobile_money');

    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true } });
    await this.notifications.create(result.concert.artist.userId, {
      type: 'purchase',
      title: 'Nouvelle vente de ticket',
      message: `${buyer?.pseudo} a acheté ${quantity} ticket(s) pour "${result.concert.title}" (+${earnings.net} FCFA net)`,
      linkUrl: `/concerts/${result.concert.slug}`,
    });

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    return { payment, ticket: result.ticket, earnings, status: 'COMPLETED' };
  }

  async processLiveAccessPayment(userId: string, liveId: string, method: string, phone?: string) {
    const live = await this.prisma.paidLive.findUnique({ where: { id: liveId }, include: { artist: true } });
    if (!live) throw new NotFoundException('Live non trouvé');
    if (live.price === 0) throw new BadRequestException('Ce live est gratuit, accès automatique');

    const existing = await this.prisma.paidLiveAccess.findUnique({ where: { userId_liveId: { userId, liveId } } });
    if (existing) throw new BadRequestException('Vous avez déjà accès à ce live');

    const result = await this.initiatePayment(userId, {
      amount: live.price,
      method,
      targetType: 'live_access',
      targetId: liveId,
      phone,
    });

    if (result.status !== 'COMPLETED') {
      return {
        ...result,
        message: 'Confirmez le paiement sur votre téléphone (USSD)',
      };
    }

    return this.finalizeLiveAccess(result.payment.id, userId, liveId);
  }

  private async finalizeLiveAccess(paymentId: string, userId: string, liveId: string) {
    const live = await this.prisma.paidLive.findUnique({ where: { id: liveId }, include: { artist: true } });
    if (!live) throw new NotFoundException('Live non trouvé');

    const access = await this.prisma.paidLiveAccess.create({
      data: { userId, liveId, amount: live.price },
    });

    const earnings = await this.wallet.creditArtistEarnings(live.artist.userId, live.price, 'mobile_money');

    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true } });
    await this.notifications.create(live.artist.userId, {
      type: 'purchase',
      title: 'Nouvelle vente de live',
      message: `${buyer?.pseudo} a acheté l'accès au live "${live.title}" (+${earnings.net} FCFA net)`,
      linkUrl: `/lives/${live.slug}`,
    });

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    return { payment, access, earnings, status: 'COMPLETED' };
  }

  async processAlbumPayment(userId: string, albumId: string, method: string, phone?: string) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId }, include: { artist: true } });
    if (!album) throw new NotFoundException('Album non trouvé');
    if (album.isFree || album.price === 0) throw new BadRequestException('Cet album est gratuit');

    const existing = await this.prisma.albumPurchase.findUnique({ where: { userId_albumId: { userId, albumId } } });
    if (existing) throw new BadRequestException('Vous avez déjà acheté cet album');

    const result = await this.initiatePayment(userId, {
      amount: album.price,
      method,
      targetType: 'album',
      targetId: albumId,
      phone,
    });

    if (result.status !== 'COMPLETED') {
      return {
        ...result,
        message: 'Confirmez le paiement sur votre téléphone (USSD)',
      };
    }

    return this.finalizeAlbumPurchase(result.payment.id, userId, albumId);
  }

  private async finalizeAlbumPurchase(paymentId: string, userId: string, albumId: string) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId }, include: { artist: true } });
    if (!album) throw new NotFoundException('Album non trouvé');

    const purchase = await this.prisma.albumPurchase.create({
      data: { userId, albumId, amount: album.price },
    });

    const earnings = await this.wallet.creditArtistEarnings(album.artist.userId, album.price, 'mobile_money');

    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { pseudo: true } });
    await this.notifications.create(album.artist.userId, {
      type: 'purchase',
      title: 'Album acheté',
      message: `${buyer?.pseudo} a acheté l'album "${album.title}" (+${earnings.net} FCFA net)`,
      linkUrl: `/albums/${album.slug}`,
    });

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    return { payment, purchase, earnings, status: 'COMPLETED' };
  }

  /**
   * Webhook PawaPay : reçoit la confirmation du dépôt et finalise l'achat.
   */
  async handlePawapayCallback(payload: { depositId: string; status: string }) {
    const { depositId, status } = payload;
    this.logger.log(`PawaPay callback: ${depositId} → ${status}`);

    const payment = await this.prisma.payment.findFirst({ where: { reference: depositId } });
    if (!payment) {
      this.logger.warn(`Callback pour paiement inconnu: ${depositId}`);
      return { received: true };
    }

    if (payment.status !== 'PENDING') {
      return { received: true }; // déjà traité (idempotence)
    }

    if (status !== 'COMPLETED') {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      return { received: true };
    }

    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED' } });

    // Finaliser l'achat selon le type
    try {
      if (payment.targetType === 'concert_ticket') {
        await this.finalizeConcertTicket(payment.id, payment.userId, payment.targetId, payment.quantity || 1);
      } else if (payment.targetType === 'live_access') {
        await this.finalizeLiveAccess(payment.id, payment.userId, payment.targetId);
      } else if (payment.targetType === 'album') {
        await this.finalizeAlbumPurchase(payment.id, payment.userId, payment.targetId);
      }
    } catch (err) {
      this.logger.error(`Erreur finalisation ${payment.targetType}: ${err}`);
    }

    return { received: true };
  }

  /**
   * Vérification manuelle du statut (polling depuis le frontend).
   */
  async checkPaymentStatus(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, userId } });
    if (!payment) throw new NotFoundException('Paiement non trouvé');

    if (payment.status === 'PENDING' && payment.reference?.startsWith('NGW-') === false) {
      // Polling PawaPay
      const status = await this.pawapay.checkDepositStatus(payment.reference);
      if (status === 'COMPLETED') {
        await this.handlePawapayCallback({ depositId: payment.reference, status });
        return this.prisma.payment.findUnique({ where: { id: paymentId } });
      }
      if (status === 'FAILED' || status === 'REJECTED') {
        await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      }
    }

    return payment;
  }

  async getUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
