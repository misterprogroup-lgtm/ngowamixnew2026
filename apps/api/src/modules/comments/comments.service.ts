import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByTrack(trackId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { trackId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, pseudo: true, avatarUrl: true } },
        },
      }),
      this.prisma.comment.count({ where: { trackId } }),
    ]);
    return {
      data: comments,
      meta: { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / (limit ?? 20)) },
    };
  }

  async create(userId: string, trackId: string, content: string) {
    const track = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!track) throw new NotFoundException('Morceau non trouvé');

    return this.prisma.comment.create({
      data: { userId, trackId, content },
      include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } },
    });
  }

  async delete(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Commentaire non trouvé');
    if (comment.userId !== userId) throw new NotFoundException('Non autorisé');

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: 'Commentaire supprimé' };
  }
}
