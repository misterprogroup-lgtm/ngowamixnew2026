import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CloudinaryService, UploadFolder } from '../../common/modules/cloudinary/cloudinary.service';

const AUDIO_MIMES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/webm'];
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function memoryInterceptor(opts: { maxSize: number; allowedMimes: string[] }) {
  return FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: opts.maxSize },
    fileFilter: (_req, file, cb) => {
      if (opts.allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Format de fichier non supporté'), false);
      }
    },
  });
}

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private cloudinary: CloudinaryService) {}

  @Post('audio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Uploader un fichier audio' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(memoryInterceptor({ maxSize: 50 * 1024 * 1024, allowedMimes: AUDIO_MIMES }))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const url = await this.cloudinary.uploadBuffer(file.buffer, 'audio', file.originalname);
    return { url, filename: file.originalname, size: file.size };
  }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Uploader une image (pochette, avatar, bannière)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(memoryInterceptor({ maxSize: 5 * 1024 * 1024, allowedMimes: IMAGE_MIMES }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const url = await this.cloudinary.uploadBuffer(file.buffer, 'covers', file.originalname);
    return { url, filename: file.originalname, size: file.size };
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Uploader un avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(memoryInterceptor({ maxSize: 3 * 1024 * 1024, allowedMimes: IMAGE_MIMES }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const url = await this.cloudinary.uploadBuffer(file.buffer, 'avatars', file.originalname);
    return { url, filename: file.originalname, size: file.size };
  }

  @Post('banner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Uploader une bannière artiste' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(memoryInterceptor({ maxSize: 5 * 1024 * 1024, allowedMimes: IMAGE_MIMES }))
  async uploadBanner(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const url = await this.cloudinary.uploadBuffer(file.buffer, 'banners', file.originalname);
    return { url, filename: file.originalname, size: file.size };
  }
}
