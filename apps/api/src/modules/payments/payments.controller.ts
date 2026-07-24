import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import type { Request } from 'express';

@ApiTags('Paiements')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private config: ConfigService,
  ) {}

  @Post('concert/:concertId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payer des tickets de concert' })
  payConcert(
    @CurrentUser('id') userId: string,
    @Param('concertId') concertId: string,
    @Body('quantity') quantity: number,
    @Body('method') method: string,
    @Body('phone') phone?: string,
  ) {
    return this.paymentsService.processConcertTicketPayment(userId, concertId, quantity || 1, method, phone);
  }

  @Post('live/:liveId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payer l\'accès à un live' })
  payLive(
    @CurrentUser('id') userId: string,
    @Param('liveId') liveId: string,
    @Body('method') method: string,
    @Body('phone') phone?: string,
  ) {
    return this.paymentsService.processLiveAccessPayment(userId, liveId, method, phone);
  }

  @Post('album/:albumId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acheter un album' })
  payAlbum(
    @CurrentUser('id') userId: string,
    @Param('albumId') albumId: string,
    @Body('method') method: string,
    @Body('phone') phone?: string,
  ) {
    return this.paymentsService.processAlbumPayment(userId, albumId, method, phone);
  }

  @Get(':paymentId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier le statut d\'un paiement (polling)' })
  checkStatus(@CurrentUser('id') userId: string, @Param('paymentId') paymentId: string) {
    return this.paymentsService.checkPaymentStatus(paymentId, userId);
  }

  @Post('webhook/pawapay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook PawaPay (callback de confirmation)' })
  async pawapayWebhook(@Req() req: Request, @Body() payload: { depositId: string; status: string }) {
    const secret = this.config.get<string>('PAWAPAY_WEBHOOK_SECRET');
    if (secret) {
      const signature = req.headers['x-pawapay-signature'] as string;
      if (!signature) throw new UnauthorizedException('Missing webhook signature');
      const crypto = await import('crypto');
      const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
      if (signature !== expected) throw new UnauthorizedException('Invalid webhook signature');
    }
    return this.paymentsService.handlePawapayCallback(payload);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique des paiements' })
  getHistory(@CurrentUser('id') userId: string) {
    return this.paymentsService.getUserPayments(userId);
  }
}
