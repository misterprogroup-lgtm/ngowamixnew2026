import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('upload.dir', './uploads');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = ['audio', 'covers', 'avatars', 'banners'];
    for (const dir of dirs) {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  getAudioPath(filename: string): string {
    return path.join(this.uploadDir, 'audio', filename);
  }

  getCoverPath(filename: string): string {
    return path.join(this.uploadDir, 'covers', filename);
  }

  getAvatarPath(filename: string): string {
    return path.join(this.uploadDir, 'avatars', filename);
  }

  getBannerPath(filename: string): string {
    return path.join(this.uploadDir, 'banners', filename);
  }

  deleteFile(filePath: string) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
