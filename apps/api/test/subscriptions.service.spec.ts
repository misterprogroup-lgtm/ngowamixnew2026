import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from '../src/modules/subscriptions/subscriptions.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { BadRequestException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prismaMock: any;
  let paymentsMock: any;

  beforeEach(async () => {
    prismaMock = {
      subscription: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    paymentsMock = {
      initiatePayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PaymentsService, useValue: paymentsMock },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('getPlans', () => {
    it('should return all subscription plans', () => {
      const plans = service.getPlans();
      expect(plans.length).toBe(5);
      expect(plans.map(p => p.id)).toContain('GRATUIT');
      expect(plans.map(p => p.id)).toContain('PRO_MENSUEL');
      expect(plans.map(p => p.id)).toContain('PRO_ANNUEL');
      expect(plans.map(p => p.id)).toContain('FAMILLE_MENSUEL');
      expect(plans.map(p => p.id)).toContain('FAMILLE_ANNUEL');
    });

    it('should have correct pricing', () => {
      const plans = service.getPlans();
      const proMensuel = plans.find(p => p.id === 'PRO_MENSUEL');
      expect(proMensuel!.price).toBe(2000);

      const proAnnuel = plans.find(p => p.id === 'PRO_ANNUEL');
      expect(proAnnuel!.price).toBe(20000);

      const familleAnnuel = plans.find(p => p.id === 'FAMILLE_ANNUEL');
      expect(familleAnnuel!.price).toBe(50000);
    });

    it('should have unlimited limits for premium plans', () => {
      const plans = service.getPlans();
      const premiumPlans = plans.filter(p => p.id !== 'GRATUIT');
      for (const plan of premiumPlans) {
        expect(plan.listenLimit).toBe(-1);
        expect(plan.downloadLimit).toBe(-1);
      }
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return default free plan if no subscription', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      const result = await service.getCurrentSubscription('user1');
      expect(result.plan).toBe('GRATUIT');
      expect(result.status).toBe('ACTIVE');
    });

    it('should return existing subscription', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        userId: 'user1',
        plan: 'PRO_MENSUEL',
        status: 'ACTIVE',
      });

      const result = await service.getCurrentSubscription('user1');
      expect(result.plan).toBe('PRO_MENSUEL');
      expect(result.price).toBe(2000);
    });
  });

  describe('subscribe', () => {
    it('should throw for invalid plan', async () => {
      await expect(service.subscribe('user1', 'INVALID_PLAN')).rejects.toThrow(BadRequestException);
    });

    it('should require payment method for paid plans', async () => {
      await expect(service.subscribe('user1', 'PRO_MENSUEL')).rejects.toThrow('Méthode de paiement requise');
    });

    it('should create free subscription without payment', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);
      prismaMock.subscription.create.mockResolvedValue({
        userId: 'user1',
        plan: 'GRATUIT',
        status: 'ACTIVE',
      });

      const result = await service.subscribe('user1', 'GRATUIT');
      expect(result.plan).toBe('GRATUIT');
    });
  });

  describe('cancel', () => {
    it('should throw if no active subscription', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);
      await expect(service.cancel('user1')).rejects.toThrow('Aucun abonnement actif');
    });

    it('should throw if trying to cancel free plan', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        plan: 'GRATUIT',
      });
      await expect(service.cancel('user1')).rejects.toThrow('Aucun abonnement actif');
    });
  });

  describe('checkPremium', () => {
    it('should return false for free users', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        plan: 'GRATUIT',
      });
      const result = await service.checkPremium('user1');
      expect(result).toBe(false);
    });

    it('should return true for Pro users', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        plan: 'PRO_MENSUEL',
      });
      const result = await service.checkPremium('user1');
      expect(result).toBe(true);
    });

    it('should return true for Famille users', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        plan: 'FAMILLE_ANNUEL',
      });
      const result = await service.checkPremium('user1');
      expect(result).toBe(true);
    });
  });
});
