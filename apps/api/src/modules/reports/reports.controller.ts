import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Signalements')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Signaler un contenu' })
  create(
    @CurrentUser('id') userId: string,
    @Body('targetType') targetType: string,
    @Body('targetId') targetId: string,
    @Body('reason') reason: string,
    @Body('details') details?: string,
  ) {
    return this.reportsService.create(userId, targetType, targetId, reason, details);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des signalements (admin)' })
  findAll(@Query() pagination: PaginationDto, @Query('status') status?: string) {
    return this.reportsService.findAll(pagination, status);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour le statut d\'un signalement (admin)' })
  updateStatus(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('status') status: string) {
    return this.reportsService.updateStatus(userId, id, status);
  }
}
