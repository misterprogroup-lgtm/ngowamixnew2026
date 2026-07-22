import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get('prefs')
  getPrefs(@CurrentUser('id') userId: string) {
    return this.service.getPrefs(userId);
  }

  @Put('prefs')
  @Patch('prefs')
  updatePrefs(
    @CurrentUser('id') userId: string,
    @Body() data: Record<string, boolean>,
  ) {
    return this.service.updatePrefs(userId, data);
  }

  @Get()
  list(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getNotifications(userId, page || 1, limit || 20);
  }

  @Put(':id/read')
  @Patch(':id/read')
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.service.markAsRead(userId, id);
  }

  @Post('read-all')
  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string) {
    return this.service.markAllAsRead(userId);
  }

  @Delete(':id')
  delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteNotification(userId, id);
  }
}
