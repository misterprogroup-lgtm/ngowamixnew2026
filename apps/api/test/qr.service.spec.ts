import { Test, TestingModule } from '@nestjs/testing';
import { QrService } from '../src/modules/qr/qr.service';

describe('QrService', () => {
  let service: QrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QrService],
    }).compile();

    service = module.get<QrService>(QrService);
  });

  describe('generateQrDataUrl', () => {
    it('should generate a data URL from a string', async () => {
      const result = await service.generateQrDataUrl('test-payload');
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate a data URL with longer text', async () => {
      const result = await service.generateQrDataUrl('longer-test-payload-with-more-data');
      expect(result).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('generateTicketPayload', () => {
    it('should generate valid JSON payload', () => {
      const ticket = {
        ticketId: 't1',
        concertId: 'c1',
        concertTitle: 'Concert Test',
        venue: 'Stade',
        city: 'Abidjan',
        date: '2026-12-25',
        time: '20:00',
        quantity: 2,
        buyerPseudo: 'fan1',
        qrCode: 'abc123',
      };

      const payload = service.generateTicketPayload(ticket);
      const parsed = JSON.parse(payload);

      expect(parsed.type).toBe('NGOWAMIX_TICKET');
      expect(parsed.version).toBe(1);
      expect(parsed.ticketId).toBe('t1');
      expect(parsed.concertId).toBe('c1');
      expect(parsed.concertTitle).toBe('Concert Test');
      expect(parsed.key).toBe('abc123');
    });
  });

  describe('validateTicketPayload', () => {
    it('should validate a correct payload', () => {
      const ticket = {
        ticketId: 't1',
        concertId: 'c1',
        concertTitle: 'Concert Test',
        venue: 'Stade',
        city: 'Abidjan',
        date: '2026-12-25',
        quantity: 1,
        buyerPseudo: 'fan1',
        qrCode: 'abc123',
      };

      const payload = service.generateTicketPayload(ticket);
      const validated = service.validateTicketPayload(payload);

      expect(validated).not.toBeNull();
      expect(validated!.ticketId).toBe('t1');
      expect(validated!.concertId).toBe('c1');
      expect(validated!.qrCode).toBe('abc123');
    });

    it('should reject invalid JSON', () => {
      const result = service.validateTicketPayload('not-json');
      expect(result).toBeNull();
    });

    it('should reject payload without type', () => {
      const result = service.validateTicketPayload(JSON.stringify({ tid: 't1', k: 'abc' }));
      expect(result).toBeNull();
    });

    it('should reject payload without qrCode', () => {
      const result = service.validateTicketPayload(JSON.stringify({ type: 'NGOWAMIX_TICKET', tid: 't1' }));
      expect(result).toBeNull();
    });
  });

  describe('generateTicketQr', () => {
    it('should generate QR data URL for a ticket', async () => {
      const ticket = {
        ticketId: 't1',
        concertId: 'c1',
        concertTitle: 'Concert Test',
        venue: 'Stade',
        city: 'Abidjan',
        date: '2026-12-25',
        quantity: 1,
        buyerPseudo: 'fan1',
        qrCode: 'abc123',
      };

      const result = await service.generateTicketQr(ticket);
      expect(result).toMatch(/^data:image\/png;base64,/);
    });
  });
});
