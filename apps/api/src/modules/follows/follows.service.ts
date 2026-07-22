import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class FollowsService {
  constructor(private prisma: PrismaService) {}

  async toggleFollow(userId: string, artistId: string) {
    const artist = await this.prisma.artistProfile.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artiste non trouvé');

    if (artist.userId === userId) {
      return { followed: false, message: 'Vous ne pouvez pas vous suivre vous-même' };
    }

    const existing = await this.prisma.follow.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });

    if (existing) {
      await this.prisma.follow.delete({ where: { id: existing.id } });
      await this.prisma.artistProfile.update({ where: { id: artistId }, data: { followerCount: { decrement: 1 } } });
      return { followed: false };
    } else {
      await this.prisma.follow.create({ data: { userId, artistId } });
      await this.prisma.artistProfile.update({ where: { id: artistId }, data: { followerCount: { increment: 1 } } });
      return { followed: true };
    }
  }

  async isFollowing(userId: string, artistId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });
    return !!follow;
  }

  async getMyFollowing(userId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;
    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: {
            include: { user: { select: { pseudo: true, avatarUrl: true } } },
          },
        },
      }),
      this.prisma.follow.count({ where: { userId } }),
    ]);

    return { data: follows.map((f) => f.artist), meta: { total, page: pagination.page, limit: pagination.limit } };
  }

  async getArtistFollowers(artistId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;
    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { artistId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, pseudo: true, avatarUrl: true } },
        },
      }),
      this.prisma.follow.count({ where: { artistId } }),
    ]);

    return { data: follows.map((f) => f.user), meta: { total, page: pagination.page, limit: pagination.limit } };
  }
}
