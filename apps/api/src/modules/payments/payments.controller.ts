import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('Paiements')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('concert/:concertId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payer des tickets de concert' })
  payConcert(
    @CurrentUser('id') userId: string,
    @Param('concertId') concertId: string,
    @Body('quantity') quantity: number,
    @Body('method') method: string,
  ) {
    return this.paymentsService.processConcertTicketPayment(userId, concertId, quantity || 1, method);
  }

  @Post('live/:liveId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Payer l\'accès à un live' })
  payLive(
    @CurrentUser('id') userId: string,
    @Param('liveId') liveId: string,
    @Body('method') method: string,
  ) {
    return this.paymentsService.processLiveAccessPayment(userId, liveId, method);
  }

  @Post('album/:albumId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acheter un album' })
  payAlbum(
    @CurrentUser('id') userId: string,
    @Param('albumId') albumId: string,
    @Body('method') method: string,
  ) {
    return this.paymentsService.processAlbumPayment(userId, albumId, method);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique des paiements' })
  getHistory(@CurrentUser('id') userId: string) {
    return this.paymentsService.getUserPayments(userId);
  }
}
