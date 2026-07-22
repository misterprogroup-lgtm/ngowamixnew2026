import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface PawapayDepositResult {
  depositId: string;
  status: string;
}

const COUNTRY_CORRESPONDENTS: Record<string, Record<string, string>> = {
  CIV: {
    orange_money: 'ORANGE_CI',
    mtn_money: 'MTN_CI',
    moov_money: 'MOOV_CI',
    wave: 'WAVE_CI',
  },
  CMR: {
    orange_money: 'ORANGE_CMR',
    mtn_money: 'MTN_CMR',
  },
  SEN: {
    orange_money: 'ORANGE_SEN',
    wave: 'WAVE_SEN',
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

  resolveCorrespondent(method: string): string {
    const correspondent = COUNTRY_CORRESPONDENTS[this.country]?.[method];
    if (!correspondent) {
      throw new BadRequestException(`Méthode "${method}" non supportée pour le pays ${this.country}`);
    }
    return correspondent;
  }

  private normalizePhone(phone: string): string {
    // Supprime espaces, +, et préfixes internationaux doublés
    let p = phone.replace(/[\s\-+]/g, '');
    // Si commence par 00, remplace par indicatif
    if (p.startsWith('00')) p = p.slice(2);
    // CIV: si 10 chiffres commençant par 0, ajoute 225
    if (this.country === 'CIV') {
      if (p.length === 10 && p.startsWith('0')) p = '225' + p;
      if (p.length === 8) p = '2250' + p; // ancien format 8 chiffres
    }
    return p;
  }

  async initiateDeposit(params: {
    amount: number;
    method: string;
    phone: string;
    statementDescription: string;
  }): Promise<PawapayDepositResult> {
    const correspondent = this.resolveCorrespondent(params.method);
    const currency = COUNTRY_CURRENCY[this.country] || 'XOF';
    const depositId = randomUUID();

    const body = {
      depositId,
      amount: String(params.amount),
      currency,
      correspondent,
      payer: {
        type: 'MSISDN',
        address: { value: this.normalizePhone(params.phone) },
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: params.statementDescription.slice(0, 22),
    };

    this.logger.log(`PawaPay deposit init: ${depositId} ${params.amount} ${currency} via ${correspondent}`);

    const res = await fetch(`${this.baseUrl}/v2/deposits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      this.logger.error(`PawaPay deposit failed: ${res.status} ${JSON.stringify(data)}`);
      throw new BadRequestException(data?.errorMessage || data?.message || 'Échec de l\'initiation du paiement');
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
    return data.status || 'UNKNOWN';
  }
}
