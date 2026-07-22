import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

const PLANS = {
  GRATUIT: { name: 'Gratuit', price: 0, listenLimit: 30, downloadLimit: 5, features: ['30 écoutes/jour', '5 téléchargements/jour', 'Qualité standard'] },
  PRO_MENSUEL: { name: 'Pro Mensuel', price: 2000, listenLimit: -1, downloadLimit: -1, features: ['Écoutes illimitées', 'Téléchargements illimités', 'Qualité HD', 'Sans publicité'] },
  PRO_ANNUEL: { name: 'Pro Annuel', price: 20000, listenLimit: -1, downloadLimit: -1, features: ['Écoutes illimitées', 'Téléchargements illimités', 'Qualité HD', 'Sans publicité', '2 mois offerts'] },
  FAMILLE_MENSUEL: { name: 'Famille Mensuel', price: 5000, listenLimit: -1, downloadLimit: -1, features: ['Jusqu\'à 6 comptes', 'Écoutes illimitées', 'Téléchargements illimités', 'Qualité HD', 'Sans publicité'] },
  FAMILLE_ANNUEL: { name: 'Famille Annuel', price: 50000, listenLimit: -1, downloadLimit: -1, features: ['Jusqu\'à 6 comptes', 'Écoutes illimitées', 'Téléchargements illimités', 'Qualité HD', 'Sans publicité', '2 mois offerts'] },
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  getPlans() {
    return Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
    }));
  }

  async getCurrentSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) {
      return { plan: 'GRATUIT', status: 'ACTIVE', ...PLANS.GRATUIT };
    }
    const planInfo = PLANS[sub.plan] || PLANS.GRATUIT;
    return { ...sub, ...planInfo };
  }

  async subscribe(userId: string, planId: string, paymentMethod?: string) {
    if (!PLANS[planId]) throw new BadRequestException('Plan invalide');

    const plan = PLANS[planId];

    // If plan is paid, process payment
    if (plan.price > 0) {
      if (!paymentMethod) throw new BadRequestException('Méthode de paiement requise');
      await this.paymentsService.initiatePayment(userId, {
        amount: plan.price,
        method: paymentMethod,
        targetType: 'subscription',
        targetId: planId,
      });
    }

    const now = new Date();
    const endDate = new Date(now);
    if (planId.includes('ANNUEL')) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else if (planId.includes('MENSUEL')) {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const existing = await this.prisma.subscription.findUnique({ where: { userId } });

    if (existing) {
      return this.prisma.subscription.update({
        where: { userId },
        data: {
          plan: planId as any,
          status: 'ACTIVE',
          startDate: now,
          endDate: planId === 'GRATUIT' ? null : endDate,
        },
      });
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        plan: planId as any,
        status: 'ACTIVE',
        startDate: now,
        endDate: planId === 'GRATUIT' ? null : endDate,
      },
    });
  }

  async cancel(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub || sub.plan === 'GRATUIT') throw new BadRequestException('Aucun abonnement actif');

    return this.prisma.subscription.update({
      where: { userId },
      data: { status: 'ANNULEE', autoRenew: false },
    });
  }

  async checkPremium(userId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    return sub?.plan?.includes('PRO') || sub?.plan?.includes('FAMILLE') || false;
  }
}
