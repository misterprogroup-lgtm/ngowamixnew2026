import { Inject, Injectable, Optional } from '@nestjs/common';
import { CLOUDINARY_PROVIDER } from './cloudinary.provider';
import { UploadApiOptions, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Options } from 'multer-storage-cloudinary';
import * as path from 'path';

export type UploadFolder = 'covers' | 'avatars' | 'banners' | 'audio';

@Injectable()
export class CloudinaryService {
  constructor(
    @Optional() @Inject(CLOUDINARY_PROVIDER) private cld: typeof cloudinary | null,
  ) {}

  get isConfigured(): boolean {
    return this.cld !== null;
  }

  getStorage(folder: UploadFolder, opts?: Partial<Options>): CloudinaryStorage | undefined {
    if (!this.isConfigured) return undefined;

    return new CloudinaryStorage({
      cloudinary: this.cld!,
      params: {
        folder: `ngowamix/${folder}`,
        resource_type: folder === 'audio' ? 'video' : 'image',
        allowed_formats: folder === 'audio'
          ? ['mp3', 'wav', 'ogg', 'flac', 'aac', 'mp4', 'webm']
          : ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: folder === 'audio' ? undefined : [{ quality: 'auto', fetch_format: 'auto' }],
        ...(opts?.params as any),
      },
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: UploadFolder,
    filename: string,
    options?: Partial<UploadApiOptions>,
  ): Promise<string> {
    if (!this.isConfigured) {
      return `/uploads/${folder}/${filename}`;
    }

    return new Promise((resolve) => {
      const stream = this.cld!.uploader.upload_stream(
        {
          folder: `ngowamix/${folder}`,
          resource_type: folder === 'audio' ? 'video' : 'image',
          public_id: path.parse(filename).name,
          ...options,
        },
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary buffer upload failed:', error?.message || 'unknown');
            resolve(`/uploads/${folder}/${filename}`);
          } else {
            resolve(result.secure_url);
          }
        },
      );
      stream.end(buffer);
    });
  }

  async uploadFile(
    filePath: string,
    folder: UploadFolder,
    options?: Partial<UploadApiOptions>,
  ): Promise<string> {
    if (!this.isConfigured) {
      return `/uploads/${folder}/${path.basename(filePath)}`;
    }

    try {
      const result: UploadApiResponse = await this.cld!.uploader.upload(filePath, {
        folder: `ngowamix/${folder}`,
        resource_type: folder === 'audio' ? 'video' : 'image',
        ...options,
      });
      return result.secure_url;
    } catch (error) {
      console.error(`Cloudinary upload failed for ${filePath}:`, error);
      return `/uploads/${folder}/${path.basename(filePath)}`;
    }
  }

  async deleteFile(publicIdOrUrl: string): Promise<void> {
    if (!this.isConfigured) return;
    if (!publicIdOrUrl.startsWith('http')) return;

    const parts = publicIdOrUrl.split('/');
    const idx = parts.indexOf('upload');
    if (idx < 0) return;

    const pathParts = parts.slice(idx + 1).join('/');
    const publicId = pathParts.replace(/^v\d+\//, '').replace(/\.[^.]+$/, '');

    try {
      await this.cld!.uploader.destroy(publicId);
    } catch {}
  }
}
