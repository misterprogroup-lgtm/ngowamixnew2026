import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async toggleLike(userId: string, trackId: string) {
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track) throw new NotFoundException('Morceau non trouvé');

    const existing = await this.prisma.trackLike.findUnique({
      where: { userId_trackId: { userId, trackId } },
    });

    if (existing) {
      await this.prisma.trackLike.delete({ where: { id: existing.id } });
      await this.prisma.track.update({ where: { id: trackId }, data: { likeCount: { decrement: 1 } } });
      return { liked: false };
    } else {
      await this.prisma.trackLike.create({ data: { userId, trackId } });
      await this.prisma.track.update({ where: { id: trackId }, data: { likeCount: { increment: 1 } } });
      return { liked: true };
    }
  }

  async isLiked(userId: string, trackId: string): Promise<boolean> {
    const like = await this.prisma.trackLike.findUnique({
      where: { userId_trackId: { userId, trackId } },
    });
    return !!like;
  }

  async getMyLikedTracks(userId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;
    const [likes, total] = await Promise.all([
      this.prisma.trackLike.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          track: {
            include: {
              artist: { select: { artistName: true, slug: true, user: { select: { avatarUrl: true } } } },
            },
          },
        },
      }),
      this.prisma.trackLike.count({ where: { userId } }),
    ]);

    return { data: likes.map((l) => l.track), meta: { total, page: pagination.page, limit: pagination.limit } };
  }
}
