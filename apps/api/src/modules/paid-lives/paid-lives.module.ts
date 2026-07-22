import { Module } from '@nestjs/common';
import { PaidLivesService } from './paid-lives.service';
import { PaidLivesController } from './paid-lives.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PaidLivesController],
  providers: [PaidLivesService],
  exports: [PaidLivesService],
})
export class PaidLivesModule {}
