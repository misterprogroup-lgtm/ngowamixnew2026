import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

export interface QrTicketData {
  ticketId: string;
  concertId: string;
  concertTitle: string;
  venue: string;
  city: string;
  date: string;
  time?: string;
  quantity: number;
  buyerPseudo: string;
  qrCode: string;
}

@Injectable()
export class QrService {
  async generateQrDataUrl(data: string): Promise<string> {
    return QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
    });
  }

  async generateQrBuffer(data: string): Promise<Buffer> {
    return QRCode.toBuffer(data, {
      width: 300,
      margin: 2,
    });
  }

  generateTicketPayload(ticket: QrTicketData): string {
    return JSON.stringify({
      type: 'NGOWAMIX_TICKET',
      version: 1,
      ticketId: ticket.ticketId,
      concertId: ticket.concertId,
      concertTitle: ticket.concertTitle,
      venue: ticket.venue,
      city: ticket.city,
      date: ticket.date,
      time: ticket.time,
      quantity: ticket.quantity,
      buyer: ticket.buyerPseudo,
      key: ticket.qrCode,
    });
  }

  async generateTicketQr(ticket: QrTicketData): Promise<string> {
    const payload = this.generateTicketPayload(ticket);
    return this.generateQrDataUrl(payload);
  }

  validateTicketPayload(payload: string): QrTicketData | null {
    try {
      const data = JSON.parse(payload);
      if (data.type !== 'NGOWAMIX_TICKET' || !data.ticketId || !data.key) {
        return null;
      }
      return {
        ticketId: data.ticketId,
        concertId: data.concertId,
        concertTitle: data.concertTitle,
        venue: data.venue,
        city: data.city,
        date: data.date,
        time: data.time,
        quantity: data.quantity,
        buyerPseudo: data.buyer,
        qrCode: data.key,
      };
    } catch {
      return null;
    }
  }
}
