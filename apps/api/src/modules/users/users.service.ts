import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, UpdateEmailDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        pseudo: true,
        role: true,
        avatarUrl: true,
        country: true,
        city: true,
        isVerified: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        artistProfile: {
          select: {
            id: true,
            slug: true,
            artistName: true,
            bio: true,
            bannerUrl: true,
            genres: true,
            followerCount: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (dto.pseudo && dto.pseudo !== user.pseudo) {
      const existingPseudo = await this.prisma.user.findUnique({
        where: { pseudo: dto.pseudo },
      });
      if (existingPseudo) {
        throw new ConflictException('Ce pseudo est déjà utilisé');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.pseudo && { pseudo: dto.pseudo }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.avatarUrl && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        role: true,
        avatarUrl: true,
        country: true,
        city: true,
        isVerified: true,
      },
    });

    return updatedUser;
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Mot de passe actuel incorrect');

    if (dto.newPassword.length < 8) throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hashedPassword } });
    return { message: 'Mot de passe modifié avec succès' };
  }

  async updateEmail(userId: string, dto: UpdateEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Mot de passe incorrect');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    await this.prisma.user.update({ where: { id: userId }, data: { email: dto.email } });
    return { message: 'Email modifié avec succès' };
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new ForbiddenException('Mot de passe incorrect');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        pseudo: `utilisateur_supprime_${userId.slice(0, 8)}`,
        email: `supprime_${userId.slice(0, 8)}@ngowamix.com`,
        phone: null,
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
        avatarUrl: null,
        country: null,
        city: null,
        refreshTokens: { deleteMany: {} },
      },
    });

    return { message: 'Compte supprimé avec succès' };
  }

  async getUserPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        pseudo: true,
        avatarUrl: true,
        country: true,
        city: true,
        createdAt: true,
        artistProfile: {
          select: {
            slug: true,
            artistName: true,
            bio: true,
            bannerUrl: true,
            genres: true,
            followerCount: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async upgradeToArtist(userId: string, artistName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { artistProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.artistProfile) {
      return { message: 'Vous avez déjà un profil artiste' };
    }

    const slug = this.generateSlug(artistName);

    const existingSlug = await this.prisma.artistProfile.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('Ce nom d\'artiste est déjà utilisé');
    }

    const artistProfile = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.ARTISTE },
      }),
      this.prisma.artistProfile.create({
        data: {
          userId,
          slug,
          artistName,
        },
      }),
    ]);

    return {
      message: 'Profil artiste créé avec succès',
      artistProfile: artistProfile[1],
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
