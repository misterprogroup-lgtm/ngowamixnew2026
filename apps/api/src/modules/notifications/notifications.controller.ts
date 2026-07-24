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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get('prefs')
  @ApiOperation({ summary: 'Préférences de notifications' })
  getPrefs(@CurrentUser('id') userId: string) {
    return this.service.getPrefs(userId);
  }

  @Patch('prefs')
  @ApiOperation({ summary: 'Mettre à jour les préférences' })
  updatePrefs(
    @CurrentUser('id') userId: string,
    @Body() data: Record<string, boolean>,
  ) {
    return this.service.updatePrefs(userId, data);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des notifications' })
  list(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getNotifications(userId, page || 1, limit || 20);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer comme lu' })
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.service.markAsRead(userId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Tout marquer comme lu' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.service.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteNotification(userId, id);
  }
}
