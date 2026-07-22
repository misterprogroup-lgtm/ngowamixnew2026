import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, targetType: string, targetId: string, reason: string, details?: string) {
    return this.prisma.report.create({
      data: { userId, targetType, targetId, reason, details },
    });
  }

  async findAll(pagination: PaginationDto, status?: string) {
    const { skip, limit } = pagination;
    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { pseudo: true, avatarUrl: true } } },
      }),
      this.prisma.report.count({ where }),
    ]);
    return {
      data: reports,
      meta: { total, page: pagination.page, limit: pagination.limit, totalPages: Math.ceil(total / (limit ?? 20)) },
    };
  }

  async updateStatus(adminId: string, reportId: string, status: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Signalement non trouvé');

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    await this.prisma.moderationLog.create({
      data: {
        adminId,
        action: status === 'RESOLVED' ? 'resolve_report' : 'dismiss_report',
        targetType: 'REPORT',
        targetId: reportId,
        details: {
          previousStatus: report.status,
          newStatus: status,
          reportTargetType: report.targetType,
          reportTargetId: report.targetId,
          reportReason: report.reason,
        },
      },
    });

    return updated;
  }

  async countPending() {
    return this.prisma.report.count({ where: { status: 'PENDING' } });
  }
}
