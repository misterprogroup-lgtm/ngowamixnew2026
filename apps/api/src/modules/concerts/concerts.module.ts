import { Module } from '@nestjs/common';
import { ConcertsService } from './concerts.service';
import { ConcertsController } from './concerts.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [NotificationsModule, QrModule],
  controllers: [ConcertsController],
  providers: [ConcertsService],
  exports: [ConcertsService],
})
export class ConcertsModule {}
