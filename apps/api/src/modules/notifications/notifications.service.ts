import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    type: string;
    title: string;
    message: string;
    linkUrl?: string;
  }) {
    return this.prisma.notification.create({
      data: { userId, ...data },
    });
  }

  async getPrefs(userId: string) {
    let prefs = await this.prisma.notificationPref.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await this.prisma.notificationPref.create({
        data: { userId },
      });
    }
    return prefs;
  }

  async updatePrefs(userId: string, data: Partial<{
    emailFollows: boolean;
    emailLikes: boolean;
    emailPurchases: boolean;
    emailConcerts: boolean;
    emailLives: boolean;
    emailSystem: boolean;
    pushFollows: boolean;
    pushLikes: boolean;
    pushPurchases: boolean;
  }>) {
    return this.prisma.notificationPref.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new NotFoundException('Notification introuvable');
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new NotFoundException('Notification introuvable');
    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}
