import { Test, TestingModule } from '@nestjs/testing';
import { WalletService, PLATFORM_COMMISSION_RATE } from '../src/modules/wallet/wallet.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('WalletService — Calcul des commissions (cahier §5.4)', () => {
  let service: WalletService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      wallet: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      withdrawal: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  describe('calculateEarnings', () => {
    it('devrait déduire 15% de commission + 1,5% frais Mobile Money', () => {
      const result = service.calculateEarnings(10000, 'orange_money');
      expect(result.gross).toBe(10000);
      expect(result.paymentFee).toBe(150); // 1.5%
      expect(result.platformCommission).toBe(1500); // 15%
      expect(result.net).toBe(8350);
    });

    it('devrait déduire 15% de commission + 2,5% frais carte bancaire', () => {
      const result = service.calculateEarnings(10000, 'carte_bancaire');
      expect(result.paymentFee).toBe(250); // 2.5%
      expect(result.platformCommission).toBe(1500);
      expect(result.net).toBe(8250);
    });

    it('devrait utiliser le taux MTN identique à Orange Money', () => {
      const result = service.calculateEarnings(20000, 'mtn_money');
      expect(result.paymentFee).toBe(300);
      expect(result.platformCommission).toBe(3000);
      expect(result.net).toBe(16700);
    });

    it('devrait gérer les petits montants sans net négatif', () => {
      const result = service.calculateEarnings(100, 'orange_money');
      expect(result.net).toBeGreaterThanOrEqual(0);
      expect(result.net).toBeLessThanOrEqual(100);
    });

    it('le taux de commission plateforme est 15%', () => {
      expect(PLATFORM_COMMISSION_RATE).toBe(0.15);
    });
  });

  describe('creditArtistEarnings', () => {
    it('devrait créditer le wallet avec le montant net', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1', userId: 'artist1', balance: 0, income: 0 });
      prismaMock.wallet.update.mockResolvedValue({ balance: 8350, income: 8350 });

      const result = await service.creditArtistEarnings('artist1', 10000, 'orange_money');

      expect(result.net).toBe(8350);
      expect(prismaMock.wallet.update).toHaveBeenCalledWith({
        where: { userId: 'artist1' },
        data: {
          balance: { increment: 8350 },
          income: { increment: 8350 },
        },
      });
    });

    it('devrait créer le wallet si inexistant avant crédit', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(null);
      prismaMock.wallet.create.mockResolvedValue({ id: 'w1', userId: 'artist1', balance: 0, income: 0 });
      prismaMock.wallet.update.mockResolvedValue({});

      await service.creditArtistEarnings('artist1', 5000, 'mtn_money');

      expect(prismaMock.wallet.create).toHaveBeenCalled();
    });
  });
});
