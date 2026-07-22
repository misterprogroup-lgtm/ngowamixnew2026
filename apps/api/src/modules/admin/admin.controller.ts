import { Controller, Get, Patch, Param, Query, UseGuards, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Stats globales (admin)' })
  getGlobalStats(@CurrentUser('id') userId: string) {
    return this.adminService.getGlobalStats(userId);
  }

  @Get('users')
  @ApiOperation({ summary: 'Liste des utilisateurs (admin)' })
  getUsers(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(userId, Number(page) || 1, Number(limit) || 20);
  }

  @Patch('users/:id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activer/Désactiver un utilisateur' })
  toggleUserActive(@CurrentUser('id') userId: string, @Param('id') targetUserId: string) {
    return this.adminService.toggleUserActive(userId, targetUserId);
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Modifier le rôle d\'un utilisateur (admin)' })
  changeUserRole(@CurrentUser('id') userId: string, @Param('id') targetUserId: string, @Body('role') role: UserRole) {
    return this.adminService.changeUserRole(userId, targetUserId, role);
  }

  @Patch('moderate/:targetType/:targetId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Masquer un contenu signalé (admin)' })
  moderateContent(
    @CurrentUser('id') userId: string,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    return this.adminService.moderateContent(userId, targetType, targetId);
  }

  @Get('moderation-logs')
  @ApiOperation({ summary: 'Historique de modération (admin)' })
  getModerationLogs(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getModerationLogs(userId, Number(limit) || 50, action);
  }

  @Get('comments')
  @ApiOperation({ summary: 'Tous les commentaires (admin)' })
  getAllComments(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllComments(userId, Number(page) || 1, Number(limit) || 50);
  }
}
