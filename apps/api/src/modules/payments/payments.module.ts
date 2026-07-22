import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PawapayService } from './pawapay.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, WalletModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PawapayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
