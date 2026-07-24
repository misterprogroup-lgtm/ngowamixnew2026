import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface PawapayDepositResult {
  depositId: string;
  status: string;
}

const COUNTRY_PROVIDERS: Record<string, Record<string, string>> = {
  CIV: {
    orange_money: 'ORANGE_CIV',
    mtn_money: 'MTN_MOMO_CIV',
  },
  CMR: {
    orange_money: 'ORANGE_CMR',
    mtn_money: 'MTN_MOMO_CMR',
  },
  SEN: {
    orange_money: 'ORANGE_SEN',
  },
};

const COUNTRY_CURRENCY: Record<string, string> = {
  CIV: 'XOF',
  CMR: 'XAF',
  SEN: 'XOF',
};

@Injectable()
export class PawapayService {
  private readonly logger = new Logger(PawapayService.name);

  constructor(private config: ConfigService) {}

  private get apiKey(): string {
    return this.config.get<string>('PAWAPAY_API_KEY', '');
  }

  private get baseUrl(): string {
    const env = this.config.get<string>('PAWAPAY_ENVIRONMENT', 'sandbox');
    return env === 'production' ? 'https://api.pawapay.io' : 'https://api.sandbox.pawapay.io';
  }

  private get country(): string {
    return this.config.get<string>('PAWAPAY_DEFAULT_COUNTRY', 'CIV');
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  resolveProvider(method: string): string {
    const provider = COUNTRY_PROVIDERS[this.country]?.[method];
    if (!provider) {
      const available = Object.keys(COUNTRY_PROVIDERS[this.country] || {}).join(', ');
      throw new BadRequestException(
        `Méthode "${method}" non supportée pour ${this.country}. Méthodes disponibles: ${available}`,
      );
    }
    return provider;
  }

  private normalizePhone(phone: string): string {
    let p = phone.replace(/[\s\-\+]/g, '');
    if (p.startsWith('00')) p = p.slice(2);

    if (this.country === 'CIV') {
      if (p.startsWith('225')) {
        if (p.length === 13) return p;
        return '2250' + p.slice(3);
      }
      return '225' + p;
    } else if (this.country === 'CMR') {
      if (p.startsWith('237')) return p;
      return '237' + p.replace(/^0/, '');
    } else if (this.country === 'SEN') {
      if (p.startsWith('221')) return p;
      return '221' + p.replace(/^0/, '');
    }

    this.logger.log(`Phone normalized: "${phone}" -> "${p}" (${p.length} digits)`);
    return p;
  }

  async initiateDeposit(params: {
    amount: number;
    method: string;
    phone: string;
    statementDescription: string;
  }): Promise<PawapayDepositResult> {
    const provider = this.resolveProvider(params.method);
    const currency = COUNTRY_CURRENCY[this.country] || 'XOF';
    const depositId = randomUUID();
    const phoneNumber = this.normalizePhone(params.phone);

    const body = {
      depositId,
      amount: String(params.amount),
      currency,
      payer: {
        type: 'MMO',
        accountDetails: {
          phoneNumber,
          provider,
        },
      },
      customerMessage: params.statementDescription.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 22),
    };

    this.logger.log(`PawaPay deposit init: ${depositId} ${params.amount} ${currency} via ${provider} phone=${phoneNumber}`);

    const res = await fetch(`${this.baseUrl}/v2/deposits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status === 'REJECTED') {
      const reason = data.failureReason?.failureMessage || data.errorMessage || data.message || 'Unknown error';
      this.logger.error(`PawaPay deposit rejected: ${res.status} ${JSON.stringify(data)}`);
      throw new BadRequestException(`Paiement refusé: ${reason}`);
    }

    this.logger.log(`PawaPay deposit created: ${depositId} status=${data.status}`);
    return { depositId, status: data.status || 'ACCEPTED' };
  }

  async checkDepositStatus(depositId: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/v2/deposits/${depositId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!res.ok) {
      this.logger.error(`PawaPay status check failed: ${res.status}`);
      return 'UNKNOWN';
    }

    const data = await res.json().catch(() => ({}));
    if (data.status === 'FOUND' && data.data?.status) {
      return data.data.status;
    }
    return data.status || 'UNKNOWN';
  }
}
