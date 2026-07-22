import { Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Wallet')
@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir son portefeuille' })
  getWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('wallet/earnings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gains détaillés (artiste) : brut, commissions, net' })
  getArtistEarnings(@CurrentUser('id') userId: string) {
    return this.walletService.getArtistEarnings(userId);
  }

  @Post('wallet/withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander un retrait' })
  requestWithdrawal(
    @CurrentUser('id') userId: string,
    @Body('amount') amount: number,
    @Body('method') method: string,
    @Body('account') account: string,
  ) {
    return this.walletService.requestWithdrawal(userId, amount, method, account);
  }

  @Get('admin/wallet/withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des retraits (admin)' })
  getAdminWithdrawals() {
    return this.walletService.getAdminWithdrawals();
  }

  @Patch('admin/wallet/withdrawals/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Traiter une demande de retrait (admin)' })
  processWithdrawal(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.walletService.processWithdrawal(adminUserId, id, status);
  }
}
