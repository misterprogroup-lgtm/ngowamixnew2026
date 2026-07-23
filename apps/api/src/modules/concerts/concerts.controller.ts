import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, UploadedFile, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ConcertsService } from './concerts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Concerts')
@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cover', { storage: memoryStorage() }))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Créer un concert' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    return this.concertsService.create(userId, dto, cover);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des concerts' })
  findAll(@Query() pagination: PaginationDto, @Query('upcoming') upcoming?: string) {
    return this.concertsService.findAll(pagination, upcoming === 'true');
  }

  @Get('my-concerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes concerts (artiste)' })
  getMyConcerts(@CurrentUser('id') userId: string) {
    return this.concertsService.getMyConcerts(userId);
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes tickets' })
  getMyTickets(@CurrentUser('id') userId: string) {
    return this.concertsService.getMyTickets(userId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Détails d\'un concert' })
  findBySlug(@Param('slug') slug: string) {
    return this.concertsService.findBySlug(slug);
  }

  @Post(':id/check-in')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valider un ticket par QR code (artiste)' })
  checkIn(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('qrCode') qrCode: string) {
    return this.concertsService.checkIn(userId, id, qrCode);
  }

  @Get(':id/attendees')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Participants d\'un concert (artiste)' })
  getAttendees(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.concertsService.getAttendees(userId, id);
  }

  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acheter un ticket' })
  purchaseTicket(
    @CurrentUser('id') userId: string,
    @Param('id') concertId: string,
    @Body('quantity') quantity?: number,
  ) {
    return this.concertsService.purchaseTicket(userId, concertId, quantity || 1);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un concert' })
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: any) {
    return this.concertsService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un concert' })
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.concertsService.delete(userId, id);
  }
}
