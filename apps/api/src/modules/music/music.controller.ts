import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { MusicService } from './music.service';
import { CreateTrackDto, UpdateTrackDto } from './dto/create-track.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CloudinaryService } from '../../common/modules/cloudinary/cloudinary.service';

class SearchTracksDto extends PaginationDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  q: string;
}

const AUDIO_MIMES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/webm'];

@ApiTags('Musique')
@Controller('music')
export class MusicController {
  constructor(
    private readonly musicService: MusicService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post('tracks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier un morceau' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('audioFile', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (AUDIO_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Format audio non supporté'), false);
        }
      },
    }),
  )
  async createTrack(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTrackDto,
    @UploadedFile() audioFile: Express.Multer.File,
  ) {
    if (!audioFile) throw new BadRequestException('Fichier audio requis');
    return this.musicService.createTrack(userId, dto, audioFile);
  }

  @Get('tracks')
  @ApiOperation({ summary: 'Liste des morceaux publics' })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() pagination: PaginationDto, @Query('genre') genre?: string, @Query('search') search?: string) {
    return this.musicService.findAll(pagination, genre, search);
  }

  @Get('tracks/trending')
  @ApiOperation({ summary: 'Morceaux tendances' })
  @ApiQuery({ name: 'genre', required: false })
  findTrending(@Query() pagination: PaginationDto, @Query('genre') genre?: string) {
    return this.musicService.findTrending(pagination, genre);
  }

  @Get('genres')
  @ApiOperation({ summary: 'Liste des genres disponibles' })
  getGenres() {
    return this.musicService.getGenres();
  }

  @Get('radio')
  @ApiOperation({ summary: 'Flux radio par genre (morceaux mélangés)' })
  @ApiQuery({ name: 'genre', required: true })
  @ApiQuery({ name: 'limit', required: false })
  getRadio(
    @Query('genre') genre: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.musicService.getRadio(genre, pagination);
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Morceaux recommandés basés sur l\'historique d\'écoute' })
  getRecommended(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.musicService.getRecommended(userId, pagination);
  }

  @Get('tracks/search')
  @ApiOperation({ summary: 'Rechercher des morceaux' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query() query: SearchTracksDto) {
    return this.musicService.search(query.q, query);
  }

  @Get('tracks/:slug')
  @ApiOperation({ summary: 'Détails d\'un morceau' })
  findBySlug(@Param('slug') slug: string) {
    return this.musicService.findBySlug(slug);
  }

  @Patch('tracks/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un morceau' })
  updateTrack(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTrackDto,
  ) {
    return this.musicService.updateTrack(userId, id, dto);
  }

  @Delete('tracks/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un morceau' })
  deleteTrack(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.musicService.deleteTrack(userId, id);
  }

  @Get('my-tracks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes morceaux (artiste)' })
  getMyTracks(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.musicService.getMyTracks(userId, pagination);
  }

  @Post('listen/:trackId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer une écoute (≥30s)' })
  recordListen(
    @CurrentUser('id') userId: string,
    @Param('trackId') trackId: string,
    @Body('duration') duration: number,
  ) {
    return this.musicService.recordListen(userId, trackId, duration);
  }

  @Post('download/:trackId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Télécharger un morceau' })
  recordDownload(@CurrentUser('id') userId: string, @Param('trackId') trackId: string) {
    return this.musicService.recordDownload(userId, trackId);
  }

  @Get('quota')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Statut des quotas d\'écoute/téléchargement' })
  getQuotaStatus(@CurrentUser('id') userId: string) {
    return this.musicService.getQuotaStatus(userId);
  }

  @Get('stream/:trackId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream audio d\'un morceau' })
  @ApiQuery({ name: 'download', required: false, type: Boolean })
  async streamAudio(
    @CurrentUser('id') userId: string,
    @Param('trackId') trackId: string,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    const track = await (this.musicService as any).prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      return res.status(404).json({ message: 'Morceau non trouvé' });
    }

    const isDownload = download === 'true' || download === '1';
    const filename = `${track.title.replace(/[^a-zA-Z0-9À-ÿ\s\-]/g, '').trim() || trackId}.mp3`;

    // External URL (utfs.io, S3, etc.)
    if (track.audioUrl.startsWith('http://') || track.audioUrl.startsWith('https://')) {
      if (isDownload) {
        const https = track.audioUrl.startsWith('https') ? require('https') : require('http');
        return new Promise<void>((resolve) => {
          https.get(track.audioUrl, (upstream: any) => {
            if (upstream.statusCode === 301 || upstream.statusCode === 302) {
              const redirectUrl = upstream.headers.location;
              https.get(redirectUrl, (upstream2: any) => {
                res.writeHead(200, {
                  'Content-Type': upstream2.headers['content-type'] || 'audio/mpeg',
                  'Content-Length': upstream2.headers['content-length'] || '',
                  'Content-Disposition': `attachment; filename="${filename}"`,
                });
                upstream2.pipe(res);
                upstream2.on('end', () => resolve());
              });
            } else {
              res.writeHead(upstream.statusCode, {
                ...upstream.headers,
                'Content-Type': upstream.headers['content-type'] || 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${filename}"`,
              });
              upstream.pipe(res);
              upstream.on('end', () => resolve());
            }
          }).on('error', () => {
            res.status(502).json({ message: 'Erreur lors du téléchargement' });
            resolve();
          });
        });
      }
      return res.redirect(track.audioUrl);
    }

    // Local file
    const filePath = path.join(process.cwd(), track.audioUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier audio non trouvé' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    if (isDownload) {
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': fileSize,
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    const range = res.req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const file = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  }

  @Get('listen-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique d\'écoute' })
  getListenHistory(@CurrentUser('id') userId: string) {
    return this.musicService.getListenHistory(userId);
  }

  @Get('download-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique des téléchargements' })
  getDownloadHistory(@CurrentUser('id') userId: string) {
    return this.musicService.getDownloadHistory(userId);
  }
}
