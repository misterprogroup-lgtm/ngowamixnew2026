import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const coverUploadConfig = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    if (IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Format de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF.'), false);
    }
  },
};
