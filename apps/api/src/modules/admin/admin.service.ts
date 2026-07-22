import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async checkAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') throw new ForbiddenException('Accès admin requis');
    return true;
  }

  private async log(adminId: string, action: string, targetType: string, targetId: string, details?: any) {
    return this.prisma.moderationLog.create({
      data: { adminId, action, targetType, targetId, details: details || undefined },
    });
  }

  async getGlobalStats(userId: string) {
    await this.checkAdmin(userId);

    const [totalUsers, totalArtists, totalTracks, totalAlbums, totalConcerts, totalLives, totalRevenue, pendingReports, totalModerationLogs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.artistProfile.count(),
      this.prisma.track.count(),
      this.prisma.album.count(),
      this.prisma.concert.count(),
      this.prisma.paidLive.count(),
      this.prisma.albumPurchase.aggregate({ _sum: { amount: true } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.moderationLog.count(),
    ]);

    return {
      totalUsers,
      totalArtists,
      totalTracks,
      totalAlbums,
      totalConcerts,
      totalLives,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      pendingReports,
      totalModerationLogs,
    };
  }

  async getUsers(userId: string, page = 1, limit = 20) {
    await this.checkAdmin(userId);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          pseudo: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          artistProfile: { select: { artistName: true } },
          subscription: { select: { plan: true } },
        },
      }),
      this.prisma.user.count(),
    ]);

    return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async toggleUserActive(userId: string, targetUserId: string) {
    await this.checkAdmin(userId);
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new ForbiddenException('Utilisateur non trouvé');

    const result = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: !user.isActive },
      select: { id: true, pseudo: true, isActive: true },
    });

    await this.log(userId, 'toggle_active', 'USER', targetUserId, {
      pseudo: user.pseudo,
      previousState: user.isActive,
      newState: result.isActive,
    });

    return result;
  }

  async changeUserRole(adminUserId: string, targetUserId: string, newRole: UserRole) {
    await this.checkAdmin(adminUserId);

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, pseudo: true, role: true } });
    if (!target) throw new NotFoundException('Utilisateur non trouvé');
    if (target.id === adminUserId) throw new BadRequestException('Vous ne pouvez pas modifier votre propre rôle');

    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(newRole)) throw new BadRequestException(`Rôle invalide. Rôles valides: ${validRoles.join(', ')}`);

    const result = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, pseudo: true, role: true },
    });

    await this.log(adminUserId, 'change_role', 'USER', targetUserId, {
      pseudo: target.pseudo,
      previousRole: target.role,
      newRole: result.role,
    });

    return result;
  }

  async moderateContent(adminUserId: string, targetType: string, targetId: string) {
    await this.checkAdmin(adminUserId);

    switch (targetType) {
      case 'TRACK': {
        const track = await this.prisma.track.findUnique({ where: { id: targetId } });
        if (!track) throw new NotFoundException('Morceau non trouvé');
        const result = await this.prisma.track.update({ where: { id: targetId }, data: { visibility: 'PRIVATE' }, select: { id: true, title: true, visibility: true } });
        await this.log(adminUserId, 'moderate', 'TRACK', targetId, { title: track.title, previousVisibility: track.visibility, newVisibility: 'PRIVATE' });
        return result;
      }

      case 'COMMENT': {
        const comment = await this.prisma.comment.findUnique({ where: { id: targetId } });
        if (!comment) throw new NotFoundException('Commentaire non trouvé');
        await this.prisma.comment.update({ where: { id: targetId }, data: { content: '[SUPPRIMÉ PAR MODÉRATION]' } });
        await this.log(adminUserId, 'moderate', 'COMMENT', targetId, { previousContent: comment.content.substring(0, 100) });
        return { id: targetId, status: 'moderated' };
      }

      case 'ALBUM': {
        const album = await this.prisma.album.findUnique({ where: { id: targetId } });
        if (!album) throw new NotFoundException('Album non trouvé');
        const result = await this.prisma.album.update({ where: { id: targetId }, data: { title: '[SUPPRIMÉ]' }, select: { id: true, title: true } });
        await this.log(adminUserId, 'moderate', 'ALBUM', targetId, { previousTitle: album.title });
        return result;
      }

      default:
        throw new NotFoundException(`Type de contenu non pris en charge: ${targetType}`);
    }
  }

  async getAllComments(userId: string, page = 1, limit = 50) {
    await this.checkAdmin(userId);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, pseudo: true, avatarUrl: true, email: true } },
          track: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.comment.count(),
    ]);

    return { data: comments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getModerationLogs(userId: string, limit = 50, action?: string) {
    await this.checkAdmin(userId);
    const where: any = {};
    if (action) where.action = action;

    return this.prisma.moderationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        admin: { select: { pseudo: true, avatarUrl: true } },
      },
    });
  }
}
