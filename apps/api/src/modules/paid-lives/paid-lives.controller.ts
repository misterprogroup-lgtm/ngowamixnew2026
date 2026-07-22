import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, UploadedFile, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import * as path from 'path';
import { PaidLivesService } from './paid-lives.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

const coverStorage = diskStorage({
  destination: './uploads/covers',
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

@ApiTags('Paid Lives')
@Controller('lives')
export class PaidLivesController {
  constructor(private readonly paidLivesService: PaidLivesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cover', { storage: coverStorage }))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Créer un live payant' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    return this.paidLivesService.create(userId, dto, cover);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des lives' })
  findAll(@Query() pagination: PaginationDto) {
    return this.paidLivesService.findAll(pagination);
  }

  @Get('my-lives')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes lives (artiste)' })
  getMyLives(@CurrentUser('id') userId: string) {
    return this.paidLivesService.getMyLives(userId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Détails d\'un live' })
  findBySlug(@Param('slug') slug: string) {
    return this.paidLivesService.findBySlug(slug);
  }

  @Post(':id/access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acheter l\'accès à un live' })
  purchaseAccess(@CurrentUser('id') userId: string, @Param('id') liveId: string) {
    return this.paidLivesService.purchaseAccess(userId, liveId);
  }

  @Get(':id/access/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier accès au live' })
  checkAccess(@CurrentUser('id') userId: string, @Param('id') liveId: string) {
    return this.paidLivesService.checkAccess(userId, liveId);
  }

  @Patch(':id/toggle-live')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Démarrer/Arrêter le live' })
  toggleLive(@CurrentUser('id') userId: string, @Param('id') liveId: string, @Body('isLive') isLive: boolean) {
    return this.paidLivesService.toggleLive(userId, liveId, isLive);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un live' })
  delete(@CurrentUser('id') userId: string, @Param('id') liveId: string) {
    return this.paidLivesService.delete(userId, liveId);
  }
}
