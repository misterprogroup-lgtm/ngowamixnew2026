import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Règles de monétisation (cahier des charges §5.4)
export const PLATFORM_COMMISSION_RATE = 0.15; // 15% commission plateforme
export const PAYMENT_FEE_RATES: Record<string, number> = {
  orange_money: 0.015, // 1,5% frais Mobile Money
  mtn_money: 0.015,
  carte_bancaire: 0.025, // 2,5% frais carte
};

export interface EarningsBreakdown {
  gross: number;
  paymentFee: number;
  platformCommission: number;
  net: number;
}

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule la répartition d'un revenu : brut → frais paiement + commission → net artiste
   */
  calculateEarnings(gross: number, method: string): EarningsBreakdown {
    const feeRate = PAYMENT_FEE_RATES[method] ?? 0.02;
    const paymentFee = Math.round(gross * feeRate);
    const platformCommission = Math.round(gross * PLATFORM_COMMISSION_RATE);
    const net = gross - paymentFee - platformCommission;
    return { gross, paymentFee, platformCommission, net };
  }

  /**
   * Crédite le wallet d'un artiste avec le revenu net d'une vente
   * (après déduction des frais de paiement et de la commission plateforme)
   */
  async creditArtistEarnings(artistUserId: string, gross: number, method: string): Promise<EarningsBreakdown> {
    const breakdown = this.calculateEarnings(gross, method);
    if (breakdown.net > 0) {
      await this.ensureWallet(artistUserId);
      await this.prisma.wallet.update({
        where: { userId: artistUserId },
        data: {
          balance: { increment: breakdown.net },
          income: { increment: breakdown.net },
        },
      });
    }
    return breakdown;
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { Withdrawal: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!wallet) throw new NotFoundException('Portefeuille non trouvé');
    return wallet;
  }

  async ensureWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0, income: 0, pending: 0 },
      });
    }
    return wallet;
  }

  async creditBalance(userId: string, amount: number) {
    const wallet = await this.ensureWallet(userId);
    return this.prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: amount }, income: { increment: amount } },
    });
  }

  async requestWithdrawal(userId: string, amount: number, method: string, account: string) {
    const wallet = await this.ensureWallet(userId);
    if (amount <= 0) throw new BadRequestException('Montant invalide');
    if (amount > wallet.balance) throw new BadRequestException('Solde insuffisant');

    if (amount < 5000) {
      throw new BadRequestException('Le retrait minimum est de 5 000 FCFA');
    }

    const allowedMethods = ['orange_money', 'mtn_money', 'carte_bancaire'];
    if (!allowedMethods.includes(method)) {
      throw new BadRequestException('Méthode de retrait invalide');
    }

    const withdrawal = await this.prisma.withdrawal.create({
      data: { userId, walletId: wallet.id, amount, method, account },
    });

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount }, pending: { increment: amount } },
    });

    return withdrawal;
  }

  async processWithdrawal(adminUserId: string, id: string, status: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenException('Non autorisé');

    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Demande de retrait non trouvée');

    if (status === 'APPROVED') {
      await this.prisma.wallet.update({
        where: { id: withdrawal.walletId },
        data: { pending: { decrement: withdrawal.amount } },
      });
    } else if (status === 'REJECTED') {
      await this.prisma.wallet.update({
        where: { id: withdrawal.walletId },
        data: { balance: { increment: withdrawal.amount }, pending: { decrement: withdrawal.amount } },
      });
    } else if (status === 'PAID') {
      if (withdrawal.status !== 'APPROVED') {
        throw new BadRequestException('Le retrait doit d\'abord être approuvé avant d\'être marqué comme payé');
      }
    }

    return this.prisma.withdrawal.update({
      where: { id },
      data: { status, processedAt: new Date() },
    });
  }

  async getAdminWithdrawals() {
    return this.prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { pseudo: true, email: true } } },
    });
  }

  async addBalance(userId: string, amount: number, description: string) {
    const wallet = await this.ensureWallet(userId);
    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount }, income: { increment: amount } },
    });
  }

  /**
   * Vue détaillée des gains artiste : brut par source, commissions, net, soldes
   */
  async getArtistEarnings(artistUserId: string) {
    const artistProfile = await this.prisma.artistProfile.findUnique({
      where: { userId: artistUserId },
    });
    if (!artistProfile) throw new ForbiddenException('Profil artiste requis');

    const wallet = await this.ensureWallet(artistUserId);

    const [ticketSales, liveSales, albumSales] = await Promise.all([
      this.prisma.ticket.aggregate({
        where: { concert: { artistId: artistProfile.id } },
        _sum: { totalPaid: true },
        _count: true,
      }),
      this.prisma.paidLiveAccess.aggregate({
        where: { live: { artistId: artistProfile.id } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.albumPurchase.aggregate({
        where: { album: { artistId: artistProfile.id } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const grossTickets = ticketSales._sum.totalPaid ?? 0;
    const grossLives = liveSales._sum.amount ?? 0;
    const grossAlbums = albumSales._sum.amount ?? 0;
    const grossTotal = grossTickets + grossLives + grossAlbums;

    // Le net réellement crédité = wallet.income (déjà net de commission+frais)
    const netTotal = wallet.income;
    const deductions = grossTotal - netTotal;

    return {
      gross: {
        tickets: grossTickets,
        lives: grossLives,
        albums: grossAlbums,
        total: grossTotal,
      },
      sales: {
        tickets: ticketSales._count,
        lives: liveSales._count,
        albums: albumSales._count,
        total: ticketSales._count + liveSales._count + albumSales._count,
      },
      deductions: {
        total: deductions > 0 ? deductions : 0,
        commissionRate: PLATFORM_COMMISSION_RATE,
      },
      net: netTotal,
      balance: wallet.balance,
      pending: wallet.pending,
    };
  }
}
